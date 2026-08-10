# Verdena

A Chrome extension that tells you how sustainable a brand actually is while you browse. Click the button on any website and get a scored sustainability report card, covering environmental impact, labor practices, and transparency. 

## What it does

Most people have no idea whether the brands they buy from are actually sustainable or just good at marketing. Verdena tries to fix that. It sits in your browser and when you're on any brand's website, one click gives you a breakdown of how they score across three categories with a 0-100 overall score.

It also flags greenwashing (when a brand's claims don't match their actual practices).

## How it works

**Extension (Chrome)**
- Built with Manifest V3, vanilla JavaScript, HTML/CSS
- Injects a floating button on every webpage
- Detects the brand name from page metadata (og:site_name, title tags, etc.)
- Opens a sidebar panel with the full analysis

**Backend (Python/FastAPI)**
- FastAPI server running on Uvicorn
- Calls an LLM to analyze the brand across 9 sustainability metrics
- 24-hour caching to avoid redundant API calls
- Returns a weighted score and per-category breakdown

**Scoring**
The overall score is calculated across three categories:
- Environmental (50%): carbon targets, renewable energy, waste reduction
- Social (30%): fair labor, supplier audits, diversity
- Transparency (20%): third-party audits, open data, greenwashing signals

## Stack

- Chrome Extension (Manifest V3, vanilla JS)
- FastAPI + Uvicorn
- OpenAI API
- Pydantic

## Running it

**Backend:**
```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload
```

**Extension:**
1. Open Chrome and go to `chrome://extensions`
2. Enable Developer Mode
3. Click "Load unpacked" and select the `extension` folder
4. Visit any brand's website and click the green button
