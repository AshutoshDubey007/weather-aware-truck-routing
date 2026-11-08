# 🎥 Loom Walkthrough Script: Weather-Aware Truck Routing

**Target Duration:** 5–10 Minutes  
**Audience:** Spotter Engineering Team & Evaluators  
**App URL (Local):** `http://localhost:5173` | **Backend API:** `http://127.0.0.1:8000`

---

## 📋 Walkthrough Agenda

| Time | Segment | Focus Area |
| :--- | :--- | :--- |
| **00:00 – 01:00** | Introduction & Problem Overview | Architecture, Tech Stack (React + Django), Safety Objectives |
| **01:00 – 02:30** | Requirements & Core Demo | 3 Routes, Checkpoint Sampling (10/25/50 mi), ETA & Weather |
| **02:30 – 04:30** | Risk & Load Rules in Action | Base Thresholds + Heavy Load Escalations (&gt;30k lb and &gt;40k lb) |
| **04:30 – 06:00** | Interactive Corridor Heatmap & 48h Slider | 60 FPS HTML5 Canvas Overlay, Metric Toggles, Playback Animation |
| **06:00 – 07:30** | Recommendation Engine & Ranking Logic | Fewest Severe → High → Avg Risk → Shortest Travel Time |
| **07:30 – 08:30** | Code Quality, Test Suite & Wrap-Up | Automated Unit Tests (11 tests in 60ms), Extensibility |

---

## 🎙️ Step-by-Step Recording Script

### [00:00 – 01:00] Introduction & Problem Overview
> *"Hello! Today I'm excited to present the Weather-Aware Truck Routing application built for Spotter. Heavy trucks face unique road safety hazards from severe winds, torrential downpours, and blizzard snow. Navigating these requires more than just finding the shortest GPS route—we need an intelligent routing engine that evaluates live weather forecasts at the truck's exact estimated arrival time across checkpoints and factors in the gross vehicle weight.*
>
> *This solution is built with a high-performance **React + TypeScript + Tailwind CSS** frontend using Leaflet with a custom HTML5 canvas rendering engine, paired with a robust **Django REST Framework** backend interfacing with OSRM and Open-Meteo."*

---

### [01:00 – 02:30] Requirements & Core Demo
> *"Let's examine the core interface. As required, the user enters:*
> 1. *Origin and Destination with intelligent autocomplete and popular preset freight corridors.*
> 2. *Departure date and time with quick selectors.*
> 3. *Gross load weight in pounds.*
> 4. *Configurable checkpoint sampling frequency: 10, 25, or 50 miles.*
>
> *Let's click on the preset 'New York, NY to Chicago, IL' with a standard 42,000 lb haul and click 'Analyze Weather Safety & Recommend Best Route'.*
>
> *Within milliseconds, the engine queries the OSRM routing API to generate **3 distinct highway corridors**:*
> - *Corridor A (Primary I-80 W corridor)*
> - *Corridor B (Alternate I-76 / I-70 corridor)*
> - *Corridor C (Bypass I-90 corridor)*
>
> *Along each route, checkpoints are sampled every 25 miles. Notice how the ETA is computed along the route polyline: Departure time + cumulative driving duration. For each checkpoint, we query high-resolution hourly weather forecasts for that exact arrival hour."*

---

### [02:30 – 04:30] Risk Rules & Truck Load Weight Escalation
> *(Click the 'Safety & Load Rules' button in the navbar to open the modal).*
>
> *"Let's look at how weather risk is classified:*
> - *Wind: Low &lt;25 mph, Moderate 25–34, High 35–44, Severe 45–54, and No Travel ≥55 mph.*
> - *Rain: Low &lt;0.10 in/hr, Moderate 0.10–0.25, High 0.25–0.50, Severe 0.50–1.00, and No Travel &gt;1.00 in/hr.*
> - *Snow: Low &lt;0.5 in/hr, Moderate 0.5–1.0, High 1.0–2.0, Severe 2.0–3.0, and No Travel &gt;3.0 in/hr.*
>
> *Crucially, our risk calculator strictly implements the load rules:*
> 1. *≥ 55 mph wind speed triggers **No Travel** for any load.*
> 2. *45–54 mph wind speed + load &gt; 30,000 lb is escalated from Severe to **No Travel**.*
> 3. *35–44 mph wind speed + load &gt; 40,000 lb is escalated from High to **Severe**.*
>
> *(Close modal and click on a checkpoint marker on the map).*
> *Notice when we click a checkpoint marker, the popup displays the arrival ETA, temperature, wind speed and gusts, rain rate, snowfall, and an explicit advisory explaining any load-triggered safety escalation."*

---

### [04:30 – 06:00] Interactive Corridor Heatmap & 48-Hour Forecast Slider
> *(Scroll to the map and heatmap control panel).*
>
> *"One of the standout requirements is showing a weather heatmap along the trip corridor with a 0–48 hour forecast slider.*
>
> *To guarantee 60 FPS smoothness without lag or stutter, we built a dedicated HTML5 canvas overlay on top of Leaflet. We construct a multi-point spatial grid over the entire bounding corridor and sample 49 hourly time slices.*
>
> *Watch how fluid the 0–48h forecast slider is: as we scrub forward hour by hour (+0h, +6h, +12h, +24h, +48h), the weather heatmap smoothly updates in real time.*
>
> *We can toggle between:*
> - *'Composite Risk (Load-Aware)'*
> - *'Wind Speed (mph)'*
> - *'Precipitation / Rain (in/hr)'*
> - *'Snowfall Rate (in/hr)'*
> - *'Temperature (°F)'*
>
> *Notice also the Play button: when we click Play, the application automatically runs a smooth simulation through the 48-hour forecast horizon, advancing a simulated truck icon along the highway to visualize changing weather fronts in real time!"*

---

### [06:00 – 07:30] Recommendation Engine & Multi-Factor Priority
> *(Scroll to the Route Cards and Comparison Table).*
>
> *"Now let's examine how the app recommends the best route. The specification dictates a strict preference hierarchy:*
> 1. *Fewest Severe miles (with 0 No Travel miles strictly prioritized)*
> 2. *Fewest High miles*
> 3. *Lowest average risk score*
> 4. *Shortest travel times*
>
> *The route cards show the exact miles in each risk category, the composite score (1.0 to 5.0), and a clear rationale. If an alternate route is 20 minutes faster but passes through 45 miles of high crosswinds with a 42,000 lb load, our recommendation engine flags that hazard and prioritizes the safer route.*
>
> *Drivers and dispatchers can also switch to the '3-Route Multi-Factor Table' to inspect side-by-side travel times, severe miles, high miles, and risk scores."*

---

### [07:30 – 08:30] Code Quality, Automated Test Suite & Conclusion
> *(Switch to terminal or editor).*
>
> *"Let's conclude with code quality and tests:*
> - *The backend is organized into clean, isolated services: `risk_calculator.py`, `routing_service.py`, `weather_service.py`, and `geocoding_service.py`.*
> - *We have an exhaustive unit test suite covering every single threshold boundary and load rule edge case:*
>   - *Running `python manage.py test routing.tests` runs 11 tests in just 0.06 seconds!*
> - *The frontend compiles with zero TypeScript errors or warnings.*
> - *Everything is dockerized and ready for one-command deployment.*
>
> *Thank you for your time, and I look forward to your questions!"*
