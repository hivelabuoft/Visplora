# User Study Setup Guide for Narrative Visualization

## 🎯 Overview

This system provides a complete user study platform for narrative visualization research with:
- **User Authentication** - Secure login/signup for participants
- **Interaction Logging** - Comprehensive tracking of all user actions
- **Data Persistence** - MongoDB for study data and localStorage for canvas state
- **Export Tools** - API endpoints for data analysis

## 🚀 Quick Setup

### 1. Enable Study Mode
```bash
# Edit .env.local
NEXT_PUBLIC_STUDY_MODE=true
```

### 2. Configure MongoDB
Replace the credentials in `.env.local`:
```bash
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@narrative-scaffolding.prvuku7.mongodb.net/?retryWrites=true&w=majority&appName=Narrative-Scaffolding
```

### 3. Start the Application
```bash
npm run dev
```

## 📊 Data Collection

### What Gets Tracked:
1. **User Demographics** - Age, gender, education, experience level
2. **Session Data** - Start/end times, study phase, progress
3. **Interactions** - Every click, drag, view change, node addition/deletion
4. **Canvas Snapshots** - Complete dashboard state at regular intervals
5. **Timing Data** - Response times, task durations, session length

### Interaction Types Logged:
- `click` - Button clicks, UI element interactions
- `drag` - Node movements, canvas manipulations
- `view_change` - Switching between dashboard views
- `node_add` - Adding dashboard, chart, or widget components
- `node_delete` - Removing components
- `node_edit` - Modifying component properties
- `connection_add` - Creating links between components
- `connection_delete` - Removing connections
- `save` - Manual or auto-save events
- `navigation` - Page navigation, session events
- `error` - Error conditions or unexpected behavior

## 📈 Study Flow

### Participant Experience:
1. **Registration** - Demographic info + consent
2. **Tutorial** - Introduction to the interface
3. **Practice** - Warm-up tasks
4. **Main Task** - Primary study objectives
5. **Survey** - Post-task questionnaire
6. **Completion** - Data finalization

### Research Dashboard Views:
The system adapts the UI for study contexts:
- **Story Prompt** → Data story description
- **Plot Complexity** → Data complexity levels
- **Story Tone** → Presentation styles
- **Character Development** → Audience focus
- **Timeline** → Dashboard flow stages

## 🔄 Data Export & Analysis

### API Endpoints:

#### Export All Data
```
GET /api/study?type=all
```

#### Export Specific Data Types
```
GET /api/study?type=interactions
GET /api/study?type=sessions  
GET /api/study?type=snapshots
GET /api/study?type=users
GET /api/study?type=summary
```

#### Filter by Participant or Date
```
GET /api/study?type=interactions&participantId=P001
GET /api/study?type=all&startDate=2025-01-01&endDate=2025-01-31
```

### Example Data Export:
```bash
# Export all interaction data for analysis
curl "http://localhost:3001/api/study?type=interactions" > interactions.json

# Get summary statistics
curl "http://localhost:3001/api/study?type=summary" > study_summary.json

# Export specific participant data
curl "http://localhost:3001/api/study?type=all&participantId=P001" > participant_P001.json
```

## 🔧 Configuration Options

### Study Groups (A/B Testing)
Users are automatically assigned to control/experimental groups:
```typescript
// In user registration - automatic assignment
const studyGroup = Math.random() < 0.5 ? 'control' : 'experimental';
```

### Canvas Behavior Tracking
```typescript
// Auto-save frequency (currently 1 second)
const AUTO_SAVE_DELAY = 1000;

// Canvas state snapshots on:
// - View switches
// - Auto-save triggers  
// - Task completion
// - Manual save
```

### Participant ID Generation
```typescript
// Format: P + 3-digit number (P001, P002, etc.)
const participantId = 'P' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
```

## 📋 Study Checklist

### Before Starting:
- [ ] MongoDB connection configured
- [ ] Study mode enabled (`NEXT_PUBLIC_STUDY_MODE=true`)
- [ ] Test participant registration flow
- [ ] Verify data export API endpoints
- [ ] Check interaction logging in browser console

### During Study:
- [ ] Monitor participant sessions in real-time
- [ ] Backup data exports regularly
- [ ] Track completion rates and technical issues

### After Study:
- [ ] Export all participant data
- [ ] Verify data integrity and completeness
- [ ] Clean and anonymize data for analysis
- [ ] Archive raw interaction logs

## 🎨 Customization

### Modify Study Tasks:
Edit the task instructions in `/src/app/narrative/page.tsx`:
```typescript
{isStudyMode && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
    <h3 className="font-medium text-yellow-800 mb-2">📋 Task Instructions</h3>
    <p className="text-sm text-yellow-700">
      // Customize your study instructions here
    </p>
  </div>
)}
```

### Add Custom Tracking:
Extend the `UserStudyTracker` class in `/src/lib/userStudyTracker.ts`:
```typescript
async logCustomEvent(eventData: any) {
  await this.logInteraction('custom', 'custom_event', eventData);
}
```

## 🔒 Privacy & Ethics

### Data Anonymization:
- Participant IDs are randomly generated
- No personal identifying information in interaction logs
- Email addresses stored separately from behavioral data

### Consent Management:
- Required consent checkbox in registration
- Clear explanation of data collection
- Option to withdraw from study

### Data Security:
- MongoDB Atlas provides encryption at rest
- HTTPS for all data transmission
- Local environment variables for sensitive config

---

## 🚨 Troubleshooting

### Common Issues:

**MongoDB Connection Errors:**
- Check credentials in `.env.local`
- Verify network access to MongoDB Atlas
- Test connection with MongoDB Compass

**Study Mode Not Working:**
- Ensure `NEXT_PUBLIC_STUDY_MODE=true` in `.env.local`
- Restart development server after environment changes
- Check browser console for errors

**Data Export Empty:**
- Verify participants completed interactions
- Check date filters in API requests
- Confirm MongoDB collections exist

**Interaction Logging Not Working:**
- Check browser console for tracker initialization
- Verify `userStudyTracker.initializeSession()` called
- Test with `NEXT_PUBLIC_STUDY_MODE=true`

For additional support or custom study requirements, review the codebase or extend the existing tracking infrastructure.

---

## ✅ Current Status

The Visplora narrative visualization system is now **fully functional** with:

- ✅ **Interactive dashboard canvas** with React Flow
- ✅ **Client-side state management** with localStorage persistence  
- ✅ **MongoDB integration** for user study data collection
- ✅ **User authentication** and session management
- ✅ **Comprehensive interaction tracking** with UserStudyTracker
- ✅ **Data export API** for research analysis
- ✅ **SSR-compatible architecture** with proper error handling
- ✅ **Development server** ready at `http://localhost:3000`

**Next Steps:**
1. Enable study mode: Set `NEXT_PUBLIC_STUDY_MODE=true` in `.env.local`
2. Test MongoDB connection with your credentials
3. Navigate to `http://localhost:3000/narrative` to begin research data collection

**Ready for User Studies!** 🎉
