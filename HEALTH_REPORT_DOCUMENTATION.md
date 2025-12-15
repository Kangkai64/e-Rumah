# Health Report Feature Documentation

## Overview
The Health Report feature allows elderly users to upload, manage, search, filter, sort, and share their health reports. This feature implements UC003_MaintainHealthReport use case with full CRUD functionality.

## Features Implemented

### 1. Upload Health Reports
- **Drag and Drop**: Full-screen drag and drop area that expands when user drags files into the screen
- **File Upload**: Click to browse and upload files
- **Supported Formats**: PDF, JPG, JPEG, PNG (up to 10MB)
- **Metadata Collection**:
  - Report Type (Medical Report, Lab Test, Prescription, Vaccination Record, Doctor's Visit Summary)
  - Report Date
  - Healthcare Provider
  - Optional Notes

### 2. View Health Reports
- **Table View**: Displays all health reports in a sortable table
- **Columns**: Type, Date, Healthcare Provider, Due Date, Actions
- **Sortable Headers**: Click on any column header to sort (ascending/descending)

### 3. Search Health Reports
- **Search Bar**: Search across report type, healthcare provider, file name, and notes
- **Real-time**: Press Enter or click Search button to execute search

### 4. Filter Health Reports
- **Report Type**: Filter by report type
- **Date Range**: Filter by start and end date
- **Healthcare Provider**: Filter by hospital/clinic name
- **Upload Status**: Filter by uploaded or pending
- **Due Status**: Filter by overdue, due soon, or up to date

### 5. Sort Health Reports
- **Sortable Fields**:
  - Report Date
  - Upload Date
  - Report Type
  - Healthcare Provider
  - Due Date
- **Sort Order**: Ascending or Descending

### 6. Share Health Reports
- **Share with Caregiver**: Share report with assigned caregiver
- **Share with Family Member**: Share with registered family contacts
- **Share with Healthcare Provider**: Send via secure channel
- **Download as PDF**: Save to device for manual sharing
- **Generate Shareable Link**: Create temporary access link with expiry date
- **Email**: Send via email to specified recipient

### 7. Due Date Alerts
- **Overdue Reports**: Shows error alert when report is more than 3 months old
- **Approaching Due Date**: Shows warning alert when report is 2-3 months old
- **Automatic Calculation**: Due dates are automatically calculated based on report type:
  - Medical Report: 6 months
  - Lab Test: 3 months
  - Prescription: 1 month
  - Vaccination Record: 12 months
  - Doctor's Visit Summary: 3 months

### 8. Delete Health Reports
- **Confirmation**: Asks for confirmation before deletion
- **Cascade Delete**: Deletes file from storage and database record

## File Structure

```
src/
├── models/
│   └── HealthReport.js              # Database operations model
├── services/
│   └── healthReportService.js       # Business logic service
├── controllers/
│   └── HealthReportController.jsx   # React controller component
├── views/
│   ├── HealthReportView.jsx         # Presentational view component
│   └── HealthReportView.css         # Styles for health report view
└── utils/
    └── healthReportValidation.js    # Validation utilities
```

## Architecture

### Model (HealthReport.js)
- Handles all database operations
- No imports from other models
- Methods:
  - `create()` - Create new health report
  - `getById()` - Get report by ID
  - `getByUser()` - Get all reports for a user with filters
  - `search()` - Search reports
  - `update()` - Update report
  - `delete()` - Delete report and file
  - `uploadFile()` - Upload file to Supabase storage
  - `getDueReports()` - Get overdue and due soon reports

### Service (healthReportService.js)
- Business logic layer
- Methods:
  - `uploadHealthReport()` - Upload file and create record
  - `getHealthReports()` - Get reports with filters/search
  - `getHealthReportById()` - Get single report
  - `deleteHealthReport()` - Delete report
  - `shareHealthReport()` - Share report via various methods
  - `getDueReports()` - Get due reports
  - `checkHealthReportAlerts()` - Check for alerts

### Controller (HealthReportController.jsx)
- Smart React component
- Manages all state and business logic
- Handles user interactions
- Passes props to View component

### View (HealthReportView.jsx)
- Pure presentational component
- No business logic
- Renders UI based on props
- Sub-components:
  - `AlertMessage` - Shows alerts
  - `SuccessMessage` - Shows success messages
  - `ErrorMessage` - Shows error messages
  - `DragDropArea` - File drag and drop area
  - `UploadModal` - Upload form modal
  - `ShareModal` - Share options modal
  - `SearchFilterBar` - Search and filter controls
  - `ReportsTable` - Reports table view

### Utilities (healthReportValidation.js)
- Validation functions
- Helper functions
- Constants

## Database Schema Requirements

### health_reports table
```sql
CREATE TABLE health_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  report_type TEXT NOT NULL,
  report_date DATE NOT NULL,
  healthcare_provider TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  notes TEXT,
  due_date DATE NOT NULL,
  upload_status TEXT DEFAULT 'uploaded',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### health_report_shares table
```sql
CREATE TABLE health_report_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES health_reports(id) ON DELETE CASCADE,
  shared_with_type TEXT NOT NULL,
  shared_with_id UUID,
  shared_with_email TEXT,
  share_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Storage bucket
- Bucket name: `health-reports`
- Public access: Yes
- File size limit: 10MB

## Usage

### Access the Feature
Navigate to `/health-reports` route (must be logged in)

### Upload a Report
1. Click "Upload New Report" button or drag a file into the screen
2. Fill in the form:
   - Select report type
   - Choose report date
   - Enter healthcare provider name
   - Add optional notes
3. Click "Submit"

### Search Reports
1. Enter search term in the search bar
2. Press Enter or click "Search"

### Filter Reports
1. Click "Show Filters"
2. Select filter criteria
3. Click "Apply Filters"

### Sort Reports
1. Click on any column header to sort
2. Click again to reverse sort order

### Share a Report
1. Click "Share" button on a report
2. Select sharing option
3. Fill in required information
4. Click "Share"

### Delete a Report
1. Click "Delete" button on a report
2. Confirm deletion

## Drag and Drop Behavior

### Normal State
- Drag and drop area is visible in the upload modal
- Dashed border with upload icon

### Drag Enter Screen
- Full-screen overlay appears with blue background
- Large drop zone with animation
- Text: "Drop your file here to upload"
- Overlay expands to cover entire viewport

### Drag Over
- Overlay remains visible
- Visual feedback continues

### Drop
- File is captured
- Upload modal opens automatically
- File name and size displayed
- Form ready to complete

## Validation Rules

### File Upload
- File must be selected
- File type must be PDF, JPG, JPEG, or PNG
- File size must not exceed 10MB
- Report type is required
- Report date is required and cannot be future date
- Healthcare provider is required (min 3 characters)
- Notes are optional (max 500 characters)

### Date Range Filter
- Start date must be before end date

### Share Form
- Share option is required
- Email addresses must be valid format
- Link expiry must be between 1-30 days

## Styling

### Theme
- Primary color: #007bff (blue)
- Success color: #28a745 (green)
- Error color: #dc3545 (red)
- Warning color: #ffc107 (yellow)

### Responsive Design
- Desktop: 3-column filter layout
- Tablet: 2-column filter layout
- Mobile: Single-column layout
- Table scrolls horizontally on mobile

### Animations
- Slide-in for messages
- Fade-in for overlays
- Bounce for drag overlay icon
- Scale transform for drag area

## Error Handling

### Upload Errors
- Invalid file type
- File too large
- Missing required fields
- Network errors

### Display Errors
- No data found
- Failed to fetch reports
- Failed to delete report
- Failed to share report

### Success Messages
- Health report uploaded successfully
- Health report deleted successfully
- Report shared successfully
- Shareable link copied to clipboard

## Integration Points

### Authentication
- Uses `getCurrentUser()` from `authService`
- Redirects to login if not authenticated
- Uses `ProtectedRoute` component

### Navigation
- Uses React Router for navigation
- Navigate to `/help` for help
- Navigate to `/home` to exit

### Storage
- Uses Supabase Storage for file storage
- Bucket: `health-reports`
- Public URLs for file access

## Future Enhancements

1. **Email Integration**: Implement actual email sending
2. **Notifications**: Add notification system for caregivers/family
3. **Report Preview**: Add inline PDF/image preview
4. **Bulk Operations**: Upload/delete multiple reports
5. **Export**: Export report list to CSV/PDF
6. **Analytics**: Dashboard with health report statistics
7. **Reminders**: Automatic reminders for due reports
8. **OCR**: Extract data from uploaded images
9. **Version Control**: Track report versions
10. **Audit Log**: Track all report access and shares

## Testing Checklist

- [ ] File upload (drag and drop)
- [ ] File upload (click to browse)
- [ ] Full-screen drag overlay
- [ ] File type validation
- [ ] File size validation
- [ ] Search functionality
- [ ] Filter functionality
- [ ] Sort functionality
- [ ] Share functionality (all options)
- [ ] Delete functionality
- [ ] Due date alerts
- [ ] Responsive design
- [ ] Error handling
- [ ] Success messages
- [ ] Modal interactions
- [ ] Navigation

## Support

For issues or questions, contact the development team or refer to the use case documentation (UC003_MaintainHealthReport).
