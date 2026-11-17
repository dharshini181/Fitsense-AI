# 👗 FitSense AI 

### Your Personal AI Fashion Assistant

FitSense AI is a full-stack **AI-powered fashion platform** designed to help users manage their wardrobe, discover personalized outfits, plan what to wear, prepare for travel, and interact with an AI fashion stylist.

The platform combines a **FastAPI backend** with a **Next.js frontend** and integrates powerful AI and external services including **Google Gemini, OpenWeatherMap, and Hugging Face**.

> **From what's in your wardrobe to what you should wear today — FitSense AI makes fashion personal.**

---

## ✨ Features

### 🤖 AI Fashion Stylist

* Conversational AI fashion assistant
* Personalized styling recommendations
* Context-aware outfit suggestions
* Natural-language fashion queries
* Voice interaction support

### 👕 Smart Wardrobe

* Add and manage clothing items
* Organize your digital wardrobe
* Track available clothing
* Use wardrobe data for personalized recommendations

### 👗 AI Outfit Generation

* Generate personalized outfit combinations
* Considers wardrobe items and user preferences
* Uses weather information when available
* Optional AI-generated outfit visualization

### 🧠 Computer Vision & AI Analysis

* Clothing and image understanding
* Outfit analysis
* Skin tone analysis
* Body analysis
* OCR for extracting information from images


### Virtual Try-On ("Try on me")
- Add your own photo in the AI Stylist with the camera button.
- Click **Try on me** under any outfit suggestion to see that outfit on you.
- Photos are processed for a single request only and are never stored.
- Each user is limited to 10 try-ons per day, which is configurable.
- The result is an AI-made preview, so real fit and colour may differ.

### AI Outfit Image Generation
- Click **Generate Image** under any AI reply to see the outfit on an AI-generated model.
- Images are generated with Cloudflare Workers AI (FLUX.1-schnell).

### Improved AI Stylist
- The chat box scrolls on its own, so the page stays in place.
- Voice input, spoken replies, and live weather by city are supported.

### Cleaner Onboarding
- The sign-up and onboarding pages fit on one screen with no scrolling.
- The app uses the FitSense logo throughout.

### 🌤️ Weather-Aware Recommendations

* Live weather integration through OpenWeatherMap
* Temperature-aware outfit recommendations
* Weather-conscious styling suggestions

### 📅 Outfit Planner

* Plan outfits in advance
* Organize outfits by day and occasion
* Create plans using existing wardrobe items

### ✈️ Travel Packing Assistant

* Generate personalized packing recommendations
* Considers destination weather
* Helps determine what clothing to pack
* Uses items from your wardrobe when possible

### 📊 Wardrobe & Outfit Analytics

* Track wardrobe usage
* Analyze saved outfits
* View user activity and feedback
* Generate insights from real user interactions

### 🛍️ Shopping Support

* Personalized shopping recommendations
* Recommendations based on fashion preferences
* Connected with the user's wardrobe and styling needs

### 👨‍💼 Admin Dashboard

* Admin-only dashboard
* User and platform insights
* Outfit feedback metrics
* Model-related statistics based on actual user feedback

### 🔐 Authentication & Security

* User registration and login
* JWT-based authentication
* Protected API endpoints
* User-specific data isolation
* Role-based admin access

---

# 🏗️ Tech Stack

## 🎨 Frontend

* **Next.js**
* **React**
* **JavaScript / TypeScript**
* Responsive web UI

## ⚙️ Backend

* **FastAPI**
* **Python**
* **SQLAlchemy**
* **JWT Authentication**

## 🗄️ Database

* **SQLite** — Local development
* **MySQL** — Production

## 🤖 AI & External Services

| Service                | Purpose                                                                |
| ---------------------- | ---------------------------------------------------------------------- |
| **Google Gemini**      | AI chat, vision, OCR, analysis, voice transcription and intent parsing |
| **OpenWeatherMap**     | Live weather data and weather-aware recommendations                    |
| **Hugging Face**       | AI-generated outfit imagery                                            |
| **Microsoft Edge TTS** | Text-to-speech functionality                                           |

---


## ⭐ FitSense AI 

**An AI-powered personal fashion assistant built with Next.js, FastAPI, Python, SQLAlchemy, Google Gemini, OpenWeatherMap and Hugging Face.**
