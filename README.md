# LLM Campus — Ready-to-Deploy

## Deploy to GitHub Pages

1. Create a new GitHub repository, for example `llm-campus`.
2. Upload all files and folders from this project.
3. GitHub → **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select your `main` branch and `/ (root)`.
6. Save.
7. Open the generated Pages URL.

No Node.js, npm, database, or server is required.

## Important

The app is currently a client-side personal app:
- Timetable is in `assets/data.js`.
- Attendance and notes are stored in browser `localStorage`.
- PWA/offline support is included.
- The app works on mobile and desktop.

## Change timetable

Edit only `assets/data.js`.

Each lecture is:

["Subject","Faculty","ROOM 407"]

The six time slots are defined at the top of the same file.

## Recommended next phase

For multi-device sync and an admin panel, connect this frontend to:
Google Sheets → Google Apps Script Web App → LLM Campus.

Suggested backend sheets:
TIMETABLE
SUBJECTS
FACULTY
ROOMS
ATTENDANCE
LECTURE_NOTES
CASES
ASSIGNMENTS
ACADEMIC_CALENDAR
SETTINGS
