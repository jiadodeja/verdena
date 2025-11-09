from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv
from dedalus_labs.utils.stream import stream_async
import json
import os
import anthropic
import asyncio

load_dotenv()
app = FastAPI(title="Verdena API")

# CORS for web + extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory cache
CACHE = {}
CACHE_DURATION = timedelta(hours=24)

class SustainabilityRecord(BaseModel):
    # Environmental Impact flags
    has_targets: float = 0.0
    uses_renewables: float = 0.0
    reports_scope3: float = 0.0
    waste_reduction: float = 0.0
    
    # Social & Labor Practices flags
    fair_labor: float = 0.0
    supplier_audit: float = 0.0
    diversity_policy: float = 0.0
    
    # Governance & Transparency flags
    third_party_audit: float = 0.0
    open_data: float = 0.0
    greenwashing_flag: float = 0.0
    
    # Scores
    environmental_score: float = 0.0
    social_score: float = 0.0
    transparency_score: float = 0.0
    final_score: float = 0.0
    
    # Explanation
    explanation: str = ""

class SearchResponse(BaseModel):
    brand: str
    summary: Optional[str] = None
    overall_score: str = "Low"
    sustainability_record: Optional[SustainabilityRecord] = None

def get_cache_key(brand: str) -> str:
    return f"brand_{brand.lower().strip()}"

def is_cache_valid(timestamp: str) -> bool:
    try:
        cached_time = datetime.fromisoformat(timestamp)
        return datetime.now() - cached_time < CACHE_DURATION
    except:
        return False

@app.get("/")
def root():
    return {"service": "Verdena API", "version": "0.2", "status": "ready"}

@app.get("/search")
async def search_brand(searchTerm: str):
    """
    Main endpoint: Generate sustainability record
    """
    if not searchTerm or len(searchTerm.strip()) < 2:
        raise HTTPException(status_code=400, detail="searchTerm too short")
    
    cache_key = get_cache_key(searchTerm)
    
    # Check cache
    if cache_key in CACHE:
        cached = CACHE[cache_key]
        if is_cache_valid(cached.get("timestamp", "")):
            return cached["data"]
    
    # Generate sustainability record with LLM
    sustainability_record = None
    summary = None
    overall_score = "Low"
    
    try:
        brand = await getBrandName(searchTerm)
        sustainability_record = await analyze_sustainability(brand)
        summary = sustainability_record.explanation
        
        # Determine overall score based on final_score
        if sustainability_record.final_score >= 70:
            overall_score = "High"
        elif sustainability_record.final_score >= 40:
            overall_score = "Medium"
        else:
            overall_score = "Low"
            
    except Exception as e:
        print(f"Sustainability analysis failed: {e}")
        summary = "Unable to generate sustainability analysis. "
        # Create empty sustainability record
        sustainability_record = SustainabilityRecord(
            explanation="Analysis unavailable due to system error."
        )
    
    response = SearchResponse(
        brand=brand,
        summary=summary,
        overall_score=overall_score,
        sustainability_record=sustainability_record
    )
    
    # Cache the result
    CACHE[cache_key] = {
        "data": response,
        "timestamp": datetime.now().isoformat()
    }
    
    return response

def calculate_sustainability_score(record: Dict[str, float]) -> Dict[str, float]:
    """
    Calculate sustainability score based on the provided formula
    """
    # Environmental Impact (50% weight)
    env = (record.get("has_targets", 0)
          + record.get("uses_renewables", 0)
          + record.get("reports_scope3", 0)
          + record.get("waste_reduction", 0)) / 4
    
    # Social & Labor Practices (30% weight)
    social = (record.get("fair_labor", 0)
              + record.get("supplier_audit", 0)
              + record.get("diversity_policy", 0)) / 3
    
    # Governance & Transparency (20% weight)
    transparency = (record.get("third_party_audit", 0)
                   + record.get("open_data", 0)
                   + record.get("greenwashing_flag", 0)) / 3
    
    # Apply greenwashing penalty
    transparency = max(0, transparency - 0.3 * record.get("greenwashing_flag", 0))
    
    # Calculate final score
    final_score = 100 * (0.5 * env + 0.3 * social + 0.2 * transparency)
    
    return {
        "environmental_score": round(env * 100, 1),
        "social_score": round(social * 100, 1),
        "transparency_score": round(transparency * 100, 1),
        "final_score": round(final_score, 1)
    }


async def getBrandName(searchTerm: str) -> str:
    """
    Use Dedalus and OPENAI/ANTHROPIC to find the name of brand from the title.
    """
    system_prompt = f"""You are given a search term "{searchTerm}". Your job is to find the name of brand from the search term. Return the name of the brand without any punctuation."""

    try:
        client = AsyncDedalus()
        runner = DedalusRunner(client)
        
        # Run the LLM query
        response = await runner.run(
            input=system_prompt,
            model=["openai/gpt-4o"]
        )
        
        print(f"LLM Response: {response}")
        response_text = response.final_output
        
        return response_text
        
    except Exception as e:
        print(f"LLM API error during getBrandName: {e}")
        return "Cannot determine brand name"
        

async def analyze_sustainability(brand: str) -> SustainabilityRecord:
    """
    Use Dedalus and OPENAI/ANTHROPIC to analyze evidence and generate a comprehensive sustainability record
    """
    system_prompt = """You are an expert sustainability analyst. Your job is to find out evidence about companies and products to create factual sustainability records.

A sustainability record is the public, factual evidence showing how a company or product behaves environmentally and socially — not just what it claims.

You will evaluate evidence across THREE major areas:

1. ENVIRONMENTAL IMPACT
Concrete data or commitments related to how the brand affects the planet:
- Carbon emissions (Scope 1, 2, 3)
- Carbon neutrality or reduction targets
- Energy sources (renewable vs. fossil)
- Water usage and reduction programs
- Waste management or circularity (e.g., recycling, product takeback)
- Material sourcing (organic cotton, recycled plastics)
- Pollution reduction (plastic, packaging)

2. SOCIAL & LABOR PRACTICES
How ethically the brand treats people in its supply chain:
- Fair wages and safe working conditions
- Diversity and inclusion metrics
- Supplier audits and human rights compliance
- Community involvement / philanthropy

3. GOVERNANCE & TRANSPARENCY
How open and accountable the company is about its sustainability:
- Public sustainability or ESG reports (annual disclosures)
- Independent third-party audits (e.g., B-Corp, CDP, ISO 14001)
- Whether goals are science-based or verified
- Reporting frameworks: GRI, SASB, TCFD
- Whether there are controversies (e.g., greenwashing, lawsuits)

YOUR TASK:
Analyze the provided evidence and return a JSON object with the following structure:
{
    "has_targets": 0 or 1,  // Has emission reduction or carbon neutrality targets
    "uses_renewables": 0 or 1,  // Uses or commits to renewable energy
    "reports_scope3": 0 or 1,  // Reports Scope 3 emissions or full carbon footprint
    "waste_reduction": 0 or 1,  // Has waste reduction, recycling, or circular economy programs
    "fair_labor": 0 or 1,  // Evidence of fair wages, safe conditions, or labor certifications
    "supplier_audit": 0 or 1,  // Conducts supplier audits or publishes supplier info
    "diversity_policy": 0 or 1,  // Has diversity & inclusion policies or metrics
    "third_party_audit": 0 or 1,  // Has third-party certifications (B-Corp, Fair Trade, etc.)
    "open_data": 0 or 1,  // Publishes sustainability reports or follows GRI/SASB frameworks
    "greenwashing_flag": 0 or 1,  // Evidence of greenwashing, misleading claims, or controversies
    "explanation": "A brief 3-5 sentence summary explaining the sustainability record. Include specific facts from the evidence. Be factual and avoid moralistic language."
}

IMPORTANT RULES:
- Use ONLY facts explicitly present in the evidence provided
- Set flags to 1 ONLY if there is clear evidence in the snippets
- Set flags to 0 if there is no evidence or unclear evidence
- The greenwashing_flag should be 1 if there is evidence of misleading claims, controversies, or criticism
- Your explanation should cite specific facts from the evidence
- Return ONLY valid JSON, no other text"""

    user_prompt = f""" Analyze the sustainability record for "{brand}" using your knowledge.

Return a JSON object with the sustainability flags and explanation."""


    combined_prompt = f"{system_prompt}\n\n{user_prompt}"

    try:

        combined_prompt = f"{system_prompt}\n\n{user_prompt}"
        client = AsyncDedalus()
        runner = DedalusRunner(client)
        
        # Run the LLM query
        response = await runner.run(
            input=combined_prompt,
            model=["openai/gpt-4o"]
        )
        
        print(f"LLM Response: {response}")
        response_text = response.final_output
        
        # Extract JSON from response (handle markdown code blocks)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        # Parse the JSON response
        analysis = json.loads(response_text)
        
        # Calculate scores using the formula
        scores = calculate_sustainability_score(analysis)
        
        # Create sustainability record
        record = SustainabilityRecord(
            has_targets=float(analysis.get("has_targets", 0)),
            uses_renewables=float(analysis.get("uses_renewables", 0)),
            reports_scope3=float(analysis.get("reports_scope3", 0)),
            waste_reduction=float(analysis.get("waste_reduction", 0)),
            fair_labor=float(analysis.get("fair_labor", 0)),
            supplier_audit=float(analysis.get("supplier_audit", 0)),
            diversity_policy=float(analysis.get("diversity_policy", 0)),
            third_party_audit=float(analysis.get("third_party_audit", 0)),
            open_data=float(analysis.get("open_data", 0)),
            greenwashing_flag=float(analysis.get("greenwashing_flag", 0)),
            environmental_score=scores["environmental_score"],
            social_score=scores["social_score"],
            transparency_score=scores["transparency_score"],
            final_score=scores["final_score"],
            explanation=analysis.get("explanation", "")
        )
        
        return record
        
    except Exception as e:
        print(f"LLM API error during sustainability analysis: {e}")
        # Fallback: create basic record from keyword analysis
        return SustainabilityRecord(
            explanation="Analysis unavailable due to system error."
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)