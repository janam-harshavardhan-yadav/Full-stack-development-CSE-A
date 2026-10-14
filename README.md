# Scholarship Finder — Backend API & Persistence Service

A Node.js & SQLite backend built specifically for the **Scholarship Finder** frontend. It implements only and exactly the data models, filters, eligibility rules, application trackers, document checklists, and dashboard metrics that the frontend provides.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```
*(Dependencies: `express`, `cors`, `dotenv`, `morgan`)*

### 2. Run Tests
```bash
npm test
```
Runs the automated test suite verifying all 15 endpoints.

### 3. Start the Server
```bash
npm start
```
By default, the server runs on port **3000**:
- **Web App / Frontend:** [http://localhost:3000](http://localhost:3000)
- **API Base:** [http://localhost:3000/api](http://localhost:3000/api)
- **Health Check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 🗄️ Database Architecture

The backend uses Node's native `node:sqlite` (`DatabaseSync`), storing data in `data/scholarships.db`. No external database daemon or setup is required. The schema and the 14 scholarships from the frontend are auto-seeded on first run.

### Tables

1. **`scholarships`**
   - `id`: Unique identifier (e.g., `"demo-1"`)
   - `slug`: URL-friendly slug
   - `title`: Program title
   - `provider`: Awarding organization
   - `desc`: Description
   - `min`: Minimum award amount (₹)
   - `max`: Maximum award amount (₹)
   - `levels`: JSON array of eligible education levels
   - `states`: JSON array of eligible states (empty = all states)
   - `courses`: JSON array of eligible courses (empty = any course)
   - `cat`: Category (`Merit`, `Need-based`, `Gender`, `Research`, `Course-based`, `Skill-based`, `Talent`)
   - `income`: Family income ceiling (₹, or `NULL` if none)
   - `open`: Opening date timestamp (ms)
   - `deadline`: Deadline timestamp (ms, calculated in Asia/Kolkata 23:59 IST)
   - `verified_ago`: Days ago verified
   - `verified`: Timestamp of verification
   - `docs`: JSON array of required checklist documents

2. **`user_profile`**
   - `id`: Profile ID (`'default'`)
   - `name`: Student display name
   - `level`: Education level
   - `state`: Domicile state
   - `course`: Enrolled / intended course
   - `income`: Annual family income (₹)
   - `updated_at`: Modification timestamp

3. **`saved_scholarships`**
   - `user_id`: Reference to user
   - `scholarship_id`: Reference to `scholarships(id)`
   - `saved_at`: Timestamp when saved

4. **`applications`**
   - `user_id`: Reference to user
   - `scholarship_id`: Reference to `scholarships(id)`
   - `status`: One of `"Interested"`, `"Preparing documents"`, `"Ready to apply"`, `"Submitted"`, `"Awarded"`, `"Not selected"`, `"Withdrawn"`
   - `updated_at`: Timestamp

5. **`checklist`**
   - `user_id`: Reference to user
   - `scholarship_id`: Reference to `scholarships(id)`
   - `doc`: Document name
   - `completed`: Integer boolean (0 or 1)
   - `updated_at`: Timestamp

---

## 📡 REST API Reference

### 1. Scholarships (`/api/scholarships`)

- **`GET /api/scholarships`**
  - Query parameters (matching frontend filters):
    - `q`: Search keyword across title, provider, and description
    - `level`: e.g. `"Undergraduate"`, `"Postgraduate"`, `"Class 11-12"`, `"Diploma"`
    - `course`: e.g. `"Engineering"`, `"Science"`, `"Medicine"`, `"Commerce"`, etc.
    - `state`: e.g. `"Karnataka"`, `"Andhra Pradesh"`, etc.
    - `cat`: e.g. `"Merit"`, `"Need-based"`, etc.
    - `amt`: Predefined range string (`"0-25000"`, `"25000-50000"`, `"50000-100000"`, `"100000-"`)
    - `status`: `"open"`, `"closed"`, or `"soon"` (closing in ≤14 days)
    - `sort`: `"deadline"` (soonest live first), `"amount"` (high to low), `"verified"`, `"title"` (A–Z)
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 6)
    - `includeEligibility`: `true` to compute eligibility per item against profile
  - Response:
    ```json
    {
      "success": true,
      "total": 14,
      "page": 1,
      "per_page": 6,
      "total_pages": 3,
      "data": [ ... ]
    }
    ```

- **`GET /api/scholarships/:id`**
  - Fetches details of a scholarship by ID or slug.

- **`GET /api/scholarships/:id/eligibility`**
  - Evaluates eligibility for this scholarship based on profile parameters or saved profile.
  - Query params (optional): `level`, `state`, `course`, `income`
  - Returns: `{ k: "eligible"|"potential"|"not"|"unknown", label: "...", reasons: [ ... ], checks: [ ... ] }`

---

### 2. Metadata (`/api/metadata`)

- **`GET /api/metadata`**
  - Returns dropdown values used across all filters:
    - `levels`: Education levels
    - `courses`: Available courses
    - `states`: Indian states
    - `categories`: Scholarship categories
    - `statuses`: Application statuses
    - `amountRanges`: Predefined award amount ranges
    - `sortOptions`: Sort choices

---

### 3. User Profile (`/api/profile`)

- **`GET /api/profile`**: Get current profile.
- **`PUT /api/profile`**: Save or update profile:
  ```json
  {
    "name": "Aarav Sharma",
    "level": "Undergraduate",
    "state": "Karnataka",
    "course": "Engineering",
    "income": 250000
  }
  ```
- **`DELETE /api/profile`**: Clear current profile.

---

### 4. Saved Scholarships (`/api/saved`)

- **`GET /api/saved`**: Returns saved scholarship IDs and populated items.
- **`POST /api/saved`**: Save a scholarship (`{ "scholarshipId": "demo-1" }`).
- **`DELETE /api/saved/:id`**: Remove a saved scholarship.
- **`POST /api/saved/toggle`**: Toggle save status (`{ "scholarshipId": "demo-1" }`).

---

### 5. Application Tracker (`/api/applications`)

- **`GET /api/applications`**: Returns map and list of all tracked applications.
- **`PUT /api/applications/:scholarshipId`**: Update application status:
  ```json
  {
    "status": "Preparing documents"
  }
  ```
  *(Pass empty string to remove tracking).*
- **`DELETE /api/applications/:scholarshipId`**: Remove tracking.

---

### 6. Document Checklist (`/api/checklist`)

- **`GET /api/checklist`**: Get checklist states for all scholarships.
- **`GET /api/checklist/:scholarshipId`**: Get checklist for a specific scholarship with counts and percentage.
- **`PUT /api/checklist/:scholarshipId`**: Update document check:
  ```json
  {
    "doc": "Identity proof",
    "completed": true
  }
  ```

---

### 7. Dashboard (`/api/dashboard`)

- **`GET /api/dashboard`**: Returns full aggregated dashboard metrics:
  - `stats.savedCount`: Number of saved scholarships
  - `stats.applicationsInProgress`: Count of active applications
  - `stats.upcomingDeadlinesCount`: Count of upcoming deadlines
  - `stats.checklistCompletionPercentage`: Overall % of checklist items done
  - `upcomingDeadlines`: Upcoming deadlines with countdown details
  - `applications`: Tracked applications with status tags
  - `savedScholarships`: Full saved scholarship objects
  - `rawState`: Exact state sync structure (`{ saved, apps, checks, profile }`)

---

## 📁 Project Structure

```
finder/
├── data/
│   ├── seedData.js              # Seed data & constants matching frontend
│   └── scholarships.db          # Auto-generated SQLite database
├── src/
│   ├── db.js                    # SQLite connection & schema initializer
│   ├── services/
│   │   ├── scholarshipService.js # Search, filter, sort & pagination
│   │   ├── eligibilityService.js # 4-point rule matching engine
│   │   └── dashboardService.js   # Metric calculations & aggregation
│   ├── routes/
│   │   ├── scholarships.js       # /api/scholarships
│   │   ├── metadata.js           # /api/metadata
│   │   ├── profile.js            # /api/profile
│   │   ├── saved.js              # /api/saved
│   │   ├── applications.js       # /api/applications
│   │   ├── checklist.js          # /api/checklist
│   │   └── dashboard.js          # /api/dashboard
│   └── app.js                   # Express app with CORS & static serving
├── tests/
│   └── api.test.js              # 15 end-to-end integration tests
├── scholarship-finder-1.html     # Frontend connected to API with offline fallback
├── server.js                    # Node.js entry point
├── package.json
└── README.md
```
