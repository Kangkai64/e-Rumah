// HealthReport View - Pure Presentational Component
// Receives all props from HealthReportController
// NO business logic - only UI rendering
// Now includes both User and Admin views with conditional rendering based on userRole

import React, { useRef, useState } from 'react'
import searchIcon from '../assets/icons/health_report_page/icon_search.svg'
import filterIcon from '../assets/icons/health_report_page/icon_filter.svg'
import uploadIcon from '../assets/icons/health_report_page/icon_upload_document.svg'
import sortIcon from '../assets/icons/health_report_page/icon_sort.svg'
import shareLinkIcon from '../assets/icons/health_report_page/icon_share_link.svg'
import calendarIcon from '../assets/icons/health_report_page/icon_calendar_body.svg'
import caregiverIcon from '../assets/icons/health_report_page/icon_caregiver.svg'
import familyIcon from '../assets/icons/health_report_page/icon_family.svg'
import healthcareProviderIcon from '../assets/icons/health_report_page/icon_healthcare_provider.svg'
import downloadIcon from '../assets/icons/health_report_page/icon_download.svg'
import ascIcon from '../assets/icons/health_report_page/icon_arrow_up.svg'
import descIcon from '../assets/icons/health_report_page/icon_arrow_down.svg'
import { convertImagesToPDF, isImageFile, isPDFFile, validateHealthReportFile } from '../utils/pdfConverter'

// Embedded CSS Styles
const styles = `
/* Health Report View Styles */

/* ============================================================================
   CONTAINER & LAYOUT
   ============================================================================ */

.health-report-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  min-height: 100vh;
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

.health-report-container.drag-active {
  pointer-events: none;
}

/* ============================================================================
   HEADER
   ============================================================================ */

.health-report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.health-report-header h1 {
  font-size: 2rem;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-help,
.btn-exit {
  padding: 0.5rem 1rem;
  border-radius: 30px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  font-size: 0.95rem;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-help:hover {
  background: #f0f0f0;
  border-color: #A8202D;
  color: #A8202D;
}

.btn-exit:hover {
  background: #f0f0f0;
  border-color: #666;
}

/* ============================================================================
   ALERTS & MESSAGES
   ============================================================================ */

.health-alerts {
  margin-bottom: 1.5rem;
}

.alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  font-family: 'Poppins', sans-serif;
}

.alert-error {
  background: #fee;
  border: 1px solid #fcc;
  color: #c00;
}

.alert-warning {
  background: #fff3cd;
  border: 1px solid #ffe69c;
  color: #856404;
}

.alert-icon {
  font-size: 1.25rem;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-family: 'Poppins', sans-serif;
  animation: slideIn 0.3s ease;
}

.success-icon {
  font-size: 1.25rem;
  font-weight: bold;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: #fee;
  border: 1px solid #fcc;
  color: #c00;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-family: 'Poppins', sans-serif;
  animation: slideIn 0.3s ease;
}

.error-icon {
  font-size: 1.25rem;
  font-weight: bold;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============================================================================
   LOADING STATE
   ============================================================================ */

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #A8202D;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ============================================================================
   UPLOAD SECTION
   ============================================================================ */

.upload-section {
  margin-bottom: 2rem;
}

.section-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 2rem;
  font-family: 'Poppins', sans-serif;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* ============================================================================
   NEW DASHBOARD STYLES
   ============================================================================ */

/* Statistics Section */
.statistics-section {
  margin: 2rem 0;
}

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.stat-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  font-family: 'Poppins', sans-serif;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-label {
  font-size: 1rem;
  font-family: 'Poppins', sans-serif;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  color: #333;
}

/* Upload Section Compact */
.upload-section-compact {
  margin: 2rem 0;
  display: flex;
  justify-content: center;
}

.upload-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 800px;
  text-align: center;
}

.upload-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.upload-subtitle {
  color: #666;
  margin-bottom: 1.5rem;
}

.upload-drop-area {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 3rem 1rem;
  margin-bottom: 1.5rem;
  transition: all 0.2s;
  cursor: pointer;
  text-align: center;
  background: #fafafa;
}

.upload-drop-area:hover,
.upload-drop-area.dragging {
  border-color: #A8202D;
  background: #fef2f2;
}

.upload-drop-area.has-files {
  border-color: #28a745;
  background: #f0fff4;
}

.upload-drop-area.converting {
  border-color: #f59e0b;
  background: #fffbeb;
  cursor: not-allowed;
}

.upload-drop-area.converting .spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #fbbf24;
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.upload-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.btn-submit {
  background: #A8202D;
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-submit:hover {
  background: #8c1a24;
  transform: translateY(-1px);
}

/* Health Monitoring Section */
.health-monitoring-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin: 3rem 0;
}

/* Reminder Modal */
.reminder-modal {
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.reminder-modal .form-group {
  margin-bottom: 1.25rem;
}

.reminder-modal label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
}

.reminder-modal input,
.reminder-modal select,
.reminder-modal textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.95rem;
  font-family: 'Poppins', sans-serif;
  background: white;
}

.reminder-modal input:focus,
.reminder-modal select:focus,
.reminder-modal textarea:focus {
  outline: none;
  border-color: #A8202D;
  box-shadow: 0 0 0 2px rgba(168, 32, 45, 0.1);
}

.reminder-modal textarea {
  resize: vertical;
  min-height: 80px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: normal !important;
  margin-bottom: 0 !important;
}

.checkbox-label input[type="checkbox"] {
  width: auto !important;
  margin: 0;
  transform: scale(1.2);
}

.checkmark {
  font-size: 0.95rem;
  color: #333;
}

/* Reminder buttons */
.btn-add-reminder,
.btn-add-first {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-reminder:hover {
  background: #8b1a24 !important;
  transform: translateY(-1px);
}

.btn-add-first:hover {
  background: #A8202D !important;
  color: white !important;
}

.btn-edit {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background: #f0f0f0;
  border-color: #A8202D;
  color: #A8202D;
}

/* Reminders Card */
.reminders-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.reminders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.reminders-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.tab-indicator {
  background: #f0f0f0;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #666;
  margin-left: 0.5rem;
}

.reminder-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.reminder-item:last-child {
  border-bottom: none;
}

.reminder-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.reminder-description {
  color: #666;
  font-size: 0.875rem;
}

.reminder-toggle .switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.reminder-toggle .switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #A8202D;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.btn-edit {
  background: #f0f0f0;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 30px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background: #e0e0e0;
  border-color: #A8202D;
}

.reminder-tags {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.reminder-tag {
  background: #f0f0f0;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #666;
}

/* Archived Reports Card */
.archived-reports-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.archived-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.archived-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.btn-view-all {
  background: #f0f0f0;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 30px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  transition: all 0.2s ease;
}

.btn-view-all:hover {
  background: #e0e0e0;
  border-color: #A8202D;
}

.archived-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 2px solid #e0e0e0;
  font-weight: 600;
  color: #666;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.table-row:hover {
  background: #fafafa;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  background: #f0f0f0;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  border-radius: 30px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  transition: all 0.2s ease;
}

.btn-action:hover {
  background: #e0e0e0;
  border-color: #ccc;
}

/* Search Section */
.search-section {
  margin: 2rem 0;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 12px;
  font-family: 'Poppins', sans-serif;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.search-header h2 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
}

.btn-clear-filters {
  background: transparent;
  border: none;
  color: #A8202D;
  cursor: pointer;
  font-size: 1rem;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  text-decoration: underline;
  transition: all 0.2s ease;
}

.btn-clear-filters:hover {
  color: #8c1a24;
}

/* Search Bar */
.search-bar-container {
  margin-bottom: 1.5rem;
}

.search-input-group {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  align-items: stretch;
  flex-wrap: wrap;
}

.search-input {
  position: relative;
  flex: 1;
  max-width: 600px;
}

.search-input input {
  width: 100%;
  padding: 0.875rem 3rem 0.875rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Poppins', sans-serif;
  transition: all 0.2s ease;
}

.search-input input:focus {
  outline: none;
  border-color: #A8202D;
  box-shadow: 0 0 0 3px rgba(168, 32, 45, 0.1);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  opacity: 0.6;
}

.clear-search {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #999;
}

.btn-filter,
.btn-sort {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  transition: all 0.2s ease;
  min-height: 50px;
}

.btn-filter:hover,
.btn-sort:hover {
  background: #f0f0f0;
  border-color: #A8202D;
}

.btn-filter img {
  width: 20px;
  height: 20px;
}

.filter-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.filter-btn {
  padding: 0.625rem 1.25rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-btn:hover,
.filter-btn.active {
  background: #A8202D;
  color: white;
  border-color: #A8202D;
}

/* Advanced Filters */
.advanced-filters {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  font-family: 'Poppins', sans-serif;
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-row.two-columns {
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.filter-group {
  margin-bottom: 0;
}

.filter-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #333;
  font-family: 'Poppins', sans-serif;
  font-size: 0.95rem;
}

.filter-options {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0;
  justify-content: flex-start;
}

.filter-option {
  padding: 0.625rem 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-option:hover,
.filter-option.active {
  background: #A8202D;
  color: white;
  border-color: #A8202D;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0;
}

.date-input {
  position: relative;
  flex: 1;
  min-width: 0;
  width: 280px;
}

.date-input input {
  width: 100%;
  padding: 1rem 2.5rem 1rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: 'Poppins', sans-serif;
  transition: all 0.2s ease;
}

.date-input input:focus {
  outline: none;
  border-color: #A8202D;
  box-shadow: 0 0 0 2px rgba(168, 32, 45, 0.1);
}

.calendar-icon {
  position: absolute;
  right: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  opacity: 0.6;
}

.date-separator {
  font-weight: 500;
  color: #666;
  font-family: 'Poppins', sans-serif;
  white-space: nowrap;
}

.filter-group input[type="text"] {
  width: 100%;
  padding: 0.875rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: 'Poppins', sans-serif;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.filter-group input[type="text"]:focus {
  outline: none;
  border-color: #A8202D;
  box-shadow: 0 0 0 2px rgba(168, 32, 45, 0.1);
}

.filter-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: flex-start;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.btn-reset,
.btn-apply {
  padding: 0.875rem 2rem;
  border: 1px solid #ddd;
  border-radius: 30px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  transition: all 0.2s ease;
  min-width: 100px;
}

.btn-reset {
  background: white;
  color: #666;
}

.btn-reset:hover {
  background: #f0f0f0;
  border-color: #999;
}

.btn-apply {
  background: #A8202D;
  color: white;
  border-color: #A8202D;
}

.btn-apply:hover {
  background: #8c1a24;
}

/* Results Table */
.results-table {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'Poppins', sans-serif;
}

.table-header-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 2px solid #e0e0e0;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  color: #666;
}

.table-body {
  max-height: 400px;
  overflow-y: auto;
}

.table-data-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  font-family: 'Poppins', sans-serif;
  transition: background-color 0.2s;
}

.table-data-row:hover {
  background: #fafafa;
}

.report-title {
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  margin-bottom: 0.25rem;
}

.report-ref {
  font-size: 0.875rem;
  font-family: 'Poppins', sans-serif;
  color: #666;
}

@media (max-width: 1200px) {
  .health-monitoring-section {
    grid-template-columns: 1fr;
  }
  
  .search-input-group {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .search-input {
    max-width: none;
  }
  
  .filter-row.two-columns {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .date-inputs {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .filter-buttons {
    justify-content: center;
    gap: 0.5rem;
  }
  
  .filter-btn {
    flex: 1;
    min-width: 120px;
  }
  
  .advanced-filters {
    padding: 1.5rem;
  }
  
  .filter-actions {
    justify-content: center;
  }
  
  .table-header-row,
  .table-data-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .table-header-col,
  .table-data-col {
    padding: 0.5rem 0;
    border-bottom: 1px solid #f0f0f0;
  }
}

@media (max-width: 768px) {
  .health-report-container {
    padding: 1rem;
  }
  
  .search-section {
    padding: 1.5rem;
    margin: 1rem 0;
  }
  
  .search-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .advanced-filters {
    padding: 1rem;
  }
  
  .filter-row {
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .filter-options {
    justify-content: flex-start;
  }
  
  .filter-option {
    flex: 1;
    text-align: center;
    min-width: 100px;
  }
  
  .filter-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .btn-reset,
  .btn-apply {
    width: 100%;
    justify-content: center;
  }
}

.section-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.section-subtitle {
  color: #666;
  margin: 0 0 1.5rem 0;
  font-size: 0.95rem;
  font-family: 'Poppins', sans-serif;
}

.btn-upload {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 500;
}

/* ============================================================================
   DATE PICKER STYLES
   ============================================================================ */

.date-input-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.date-picker-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px;
  margin-top: 4px;
}

.date-picker-dropdown input[type="date"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
}

.date-picker-dropdown input[type="date"]:focus {
  outline: none;
  border-color: #A8202D;
  box-shadow: 0 0 0 3px rgba(168, 32, 45, 0.1);
}

.calendar-icon {
  cursor: pointer;
  transition: opacity 0.2s;
}

.calendar-icon:hover {
  opacity: 0.7;
}

.date-input {
  position: relative;
}

/* ============================================================================
   SUCCESS OVERLAY MODAL
   ============================================================================ */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-in-out;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 60px 40px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-in-out;
  position: relative;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 28px;
  color: #666;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #000;
}

.modal-checkmark {
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-checkmark svg {
  width: 100%;
  height: 100%;
}

.modal-title {
  color: #22c55e;
  font-size: 32px;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
  margin: 20px 0 10px 0;
  line-height: 1.4;
}

.modal-message {
  color: #161519;
  font-size: 18px;
  font-weight: 400;
  font-family: 'Poppins', sans-serif;
  margin: 0;
  line-height: 1.5;
}

.modal-file-list {
  color: #666;
  font-size: 14px;
  font-family: 'Poppins', sans-serif;
  margin: 15px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

@media (max-width: 768px) {
  .modal-content {
    padding: 40px 30px;
  }

  .modal-title {
    font-size: 28px;
  }

  .modal-message {
    font-size: 16px;
  }

  .modal-checkmark {
    width: 100px;
    height: 100px;
  }
}

/* ============================================================================
   FULL PAGE DROP ZONE
   ============================================================================ */

.full-page-drop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(168, 32, 45, 0.9);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  animation: fadeIn 0.2s ease;
  font-family: 'Poppins', sans-serif;
}

.full-page-drop-content {
  text-align: center;
  color: white;
  pointer-events: none;
}

.full-page-drop-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 0.6s infinite;
}

.full-page-drop-content h2 {
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  font-family: 'Poppins', sans-serif;
}

.full-page-drop-content p {
  font-size: 1.2rem;
  margin: 0;
  opacity: 0.9;
  font-family: 'Poppins', sans-serif;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

/* File Preview Styles */
.file-preview-section {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.file-preview-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.file-preview-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.file-preview-item:hover {
  border-color: #A8202D;
  box-shadow: 0 2px 4px rgba(168, 32, 45, 0.1);
}

.file-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 500;
  font-size: 0.875rem;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Poppins', sans-serif;
}

.file-size {
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
  font-family: 'Poppins', sans-serif;
}

.remove-file-btn {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.remove-file-btn:hover {
  background: #c82333;
  transform: scale(1.1);
}

.drag-drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.drag-drop-icon {
  color: #999;
  transition: color 0.3s;
}

.drag-drop-area:hover .drag-drop-icon,
.drag-drop-area.dragging .drag-drop-icon {
  color: #A8202D;
}

.drag-drop-text {
  font-size: 1.1rem;
  color: #666;
  margin: 0;
}

.file-info {
  font-size: 0.9rem;
  color: #28a745;
  font-weight: 500;
  margin: 0;
}

/* ============================================================================
   SEARCH & FILTER
   ============================================================================ */

.search-filter-bar {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-box {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-box input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
}

.search-box input:focus {
  outline: none;
  border-color: #A8202D;
  box-shadow: 0 0 0 3px rgba(168, 32, 45, 0.1);
}

.btn-search {
  padding: 0.75rem 1.5rem;
  background: #A8202D;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-search:hover {
  background: #8B1A24;
}

.btn-filter {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.btn-filter:hover {
  background: #f0f0f0;
  border-color: #A8202D;
  color: #A8202D;
}

.filter-panel {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #FEF2F2;
}

.sort-panel {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #FEF2F2;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.sort-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sort-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sort-order-buttons {
  display: flex;
  gap: 0.5rem;
}

.sort-order-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.sort-order-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.sort-order-btn.active {
  background: #A8202D;
  color: white;
  border-color: #A8202D;
}

.filter-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #555;
}

.sort-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #555;
}

.filter-group input,
.filter-group select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
}

.sort-group input,
.sort-group select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
}

.filter-group input:focus,
.filter-group select:focus {
  outline: none;
  border-color: #A8202D;
  box-shadow: 0 0 0 3px rgba(168, 32, 45, 0.1);
}

.sort-group input:focus,
.sort-group select:focus {
  outline: none;
  border-color: #A8202D;
  box-shadow: 0 0 0 3px rgba(168, 32, 45, 0.1);
}

.filter-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

/* ============================================================================
   REPORTS TABLE
   ============================================================================ */

.reports-table-container {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
}

.reports-table thead {
  background: #f8f9fa;
  border-bottom: 2px solid #e0e0e0;
}

.reports-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.reports-table th:hover {
  background: #e9ecef;
}

.reports-table tbody tr {
  border-bottom: 1px solid #e0e0e0;
  transition: background 0.2s;
}

.reports-table tbody tr:hover {
  background: #f8f9fa;
}

.reports-table td {
  padding: 1rem;
  color: #555;
  font-size: 0.95rem;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-view {
  background: #A8202D;
  color: white;
}

.btn-view:hover {
  background: #8B1A24;
}

.btn-share {
  background: #A8202D;
  color: white;
  border-radius: 8px;
  font-weight: 500;
  padding: 8px 16px;
  transition: all 0.2s ease;
}

.btn-share:hover {
  background: #8B1A24;
  box-shadow: 0 2px 6px rgba(168, 32, 45, 0.3);
}

/* Specific styling for action-btn share buttons */
.action-btn.share-btn {
  background: #A8202D;
  border: 1px solid #A8202D;
  color: white;
}

.action-btn.share-btn:hover {
  background: #8B1A24;
  border-color: #8B1A24;
  box-shadow: 0 2px 6px rgba(168, 32, 45, 0.3);
}

/* Target Share buttons specifically by their position and context */
.actions-col .action-btn-sm:nth-child(2),
.table-actions .btn-action:nth-child(2) {
  background: #A8202D;
  border: 1px solid #A8202D;
  color: white;
  border-radius: 30px;
  font-weight: 600;
}

.actions-col .action-btn-sm:nth-child(2):hover,
.table-actions .btn-action:nth-child(2):hover {
  background: #8B1A24;
  border-color: #8B1A24;
  box-shadow: 0 2px 6px rgba(168, 32, 45, 0.3);
  transform: translateY(-1px);
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.btn-delete:hover {
  background: #c82333;
}

/* ============================================================================
   NO DATA STATE
   ============================================================================ */

.no-data {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.no-data p {
  font-size: 1.1rem;
  color: #666;
  margin: 0 0 0.5rem 0;
}

.no-data-subtitle {
  font-size: 0.95rem;
  color: #999;
}

/* ============================================================================
   MODALS
   ============================================================================ */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-button:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

/* ============================================================================
   FORM GROUPS
   ============================================================================ */

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #A8202D;
  box-shadow: 0 0 0 3px rgba(168, 32, 45, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

/* ============================================================================
   SHARE OPTIONS
   ============================================================================ */

.share-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 0.5rem;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.share-option:hover {
  border-color: #A8202D;
  background: #fef2f2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(168, 32, 45, 0.15);
}

.share-option.active {
  border-color: #A8202D;
  background: #fee2e2;
  box-shadow: 0 0 0 3px rgba(168, 32, 45, 0.1);
}

.option-icon {
  font-size: 2rem;
}

/* ============================================================================
   BUTTONS
   ============================================================================ */

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 30px;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #A8202D;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #8B1A24;
  box-shadow: 0 4px 12px rgba(168, 32, 45, 0.3);
}

.btn-secondary {
  background: transparent;
  color: #F5F5F5;
  border: 2px solid #F5F5F5;
}

.btn-secondary:hover:not(:disabled) {
  background: #F5F5F5;
  color: #A8202D;
}

/* ============================================================================
   RESPONSIVE DESIGN
   ============================================================================ */

@media (max-width: 1200px) {
  .filter-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .share-options {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .health-report-container {
    padding: 1rem;
  }

  .health-report-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .filter-row {
    grid-template-columns: 1fr;
  }

  .search-box {
    flex-direction: column;
  }

  .reports-table-container {
    overflow-x: auto;
  }

  .reports-table {
    min-width: 600px;
  }

  .actions-cell {
    flex-direction: column;
  }
}

/* Admin Health Report Dashboard Styles - Based on Figma Design */

/* ============================================================================
   CONTAINER & LAYOUT
   ============================================================================ */

.admin-dashboard-container {
  background: #f9fafb;
  min-height: 100vh;
  padding: 2rem 352px;
  position: relative;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #b91c1c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ============================================================================
   ALERTS & MESSAGES
   ============================================================================ */

.alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
}

.alert-success {
  background: #dcfce7;
  border: 1px solid #15803d;
  color: #15803d;
}

.alert-error {
  background: #fee2e2;
  border: 1px solid #b91c1c;
  color: #b91c1c;
}

/* ============================================================================
   SECTION HEADING
   ============================================================================ */

.section-heading h1 {
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 30px;
  line-height: 36px;
  color: #111827;
  margin: 0;
}

/* ============================================================================
   STATISTICS CARDS
   ============================================================================ */

.statistics-cards {
  display: flex;
  gap: 24px;
  justify-content: center;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0px 4px 6px -1px rgba(0,0,0,0.05), 0px 2px 4px -2px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 286px;
  flex-shrink: 0;
}

.stat-card-small {
  width: 210px;
}

.stat-label {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #6b7280;
}

.stat-value {
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 36px;
  line-height: 40px;
  color: #1f2937;
}

.stat-sublabel {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #9ca3af;
}

/* ============================================================================
   RECORDS MANAGEMENT
   ============================================================================ */

.records-management {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.records-table-container {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0px 4px 6px -1px rgba(0,0,0,0.05), 0px 2px 4px -2px rgba(0,0,0,0.05);
  flex: 1;
  min-width: 500px;
  max-width: 786px;
}

.table-heading h3 {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 18px;
  line-height: 28px;
  color: #1f2937;
  margin: 0 0 20px 0;
}

/* ============================================================================
   SEARCH & FILTER BAR
   ============================================================================ */

.search-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-input {
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  padding: 10px;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  color: #1f2937;
  flex: 1;
  min-width: 200px;
}

.search-input::placeholder {
  color: #9ca3af;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #6b7280;
}

.filter-select {
  background: #f3f4f6;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #1f2937;
  cursor: pointer;
}

/* ============================================================================
   RECORD TABS
   ============================================================================ */

.record-tabs {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 8px;
  padding-bottom: 1px;
}

.tab-button {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 8px 12px 10px 12px;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button.active {
  color: #A8202D;
  border-bottom-color: #A8202D;
}

.tab-button:hover:not(.active) {
  color: #1f2937;
}

.tab-info {
  flex: 1;
  padding-left: 16px;
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #9ca3af;
}

/* ============================================================================
   TABLE
   ============================================================================ */

.table-header {
  display: flex;
  gap: 16px;
  padding: 8px;
  margin-bottom: 8px;
}

.table-col {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #9ca3af;
  width: 131.73px;
  flex-shrink: 0;
}

.table-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.table-row {
  display: flex;
  gap: 16px;
  padding: 7px 8px 8px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.table-row:hover {
  background: #f9fafb;
}

.table-row.selected {
  background: #fef2f2;
}

.table-row .table-col {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #1f2937;
  display: flex;
  align-items: center;
}

.applicant-name {
  font-weight: 500;
}

/* Status Badges */
.status-badge {
  padding: 4.5px 10px;
  border-radius: 9999px;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  display: inline-block;
}

.status-pending {
  background: #ffedd5;
  color: #ea580c;
}

.status-approved {
  background: #dcfce7;
  color: #15803d;
}

.status-flagged,
.status-rejected {
  background: #fee2e2;
  color: #b91c1c;
}

/* Admin Action Buttons */
.approve-btn {
  background: #16a34a;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  margin-right: 4px;
  transition: background 0.2s ease;
}

.approve-btn:hover {
  background: #15803d;
}

.flag-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  margin-right: 4px;
  transition: background 0.2s ease;
}

.flag-btn:hover {
  background: #b91c1c;
}

.view-btn {
  background: #A8202D;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  margin-right: 4px;
  transition: background 0.2s ease;
}

.view-btn:hover {
  background: #8B1A24;
}

.archive-btn {
  background: #f59e0b;
  color: #111827;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.archive-btn:hover {
  background: #d97706;
  color: white;
}

/* Admin Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  font-family: 'Poppins', sans-serif;
}

/* PDF Viewer Modal Styles */
.pdf-viewer-overlay {
  z-index: 1100;
}

.pdf-viewer-modal {
  max-width: 90vw;
  max-height: 95vh;
  width: 1000px;
  height: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.pdf-viewer-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 1rem;
}

.pdf-viewer-modal .modal-header h3 {
  margin: 0;
  color: #111827;
  font-size: 1.25rem;
  font-weight: 600;
}

.pdf-viewer-modal .close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.2s ease;
}

.pdf-viewer-modal .close-button:hover {
  background: #f3f4f6;
}

.pdf-viewer-body {
  flex: 1;
  overflow: hidden;
  margin-bottom: 1rem;
}

.pdf-viewer-modal .modal-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.modal h3 {
  margin: 0 0 1rem 0;
  color: #111827;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal p {
  margin: 0 0 1rem 0;
  color: #6b7280;
  line-height: 1.5;
  font-size: 0.875rem;
}

.report-preview {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.report-preview p {
  margin: 0.5rem 0;
  font-size: 0.875rem;
  color: #374151;
}

.flag-reason-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem;
  font-family: 'Poppins', sans-serif;
  font-size: 0.875rem;
  resize: vertical;
  margin-bottom: 1rem;
  box-sizing: border-box;
}

.flag-reason-input:focus {
  outline: none;
  border-color: #A8202D;
  box-shadow: 0 0 0 3px rgba(168, 32, 45, 0.1);
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 30px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Poppins', sans-serif;
}

.btn-primary {
  background: #A8202D;
  color: white;
}

.btn-primary:hover {
  background: #8B1A24;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-danger:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-warning {
  background: #f59e0b;
  color: #111827;
}

.btn-warning:hover {
  background: #d97706;
  color: white;
}

.flag-modal {
  max-width: 600px;
}

/* Actions Column */
.actions-col {
  display: flex;
  gap: 8px;
  width: 144px !important;
}

.action-btn {
  background: #e5e7eb;
  border: none;
  border-radius: 30px;
  padding: 6px 16px;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #d1d5db;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
  font-family: 'Poppins', sans-serif;
}

/* ============================================================================
   REPORT DETAILS CARD
   ============================================================================ */

.report-details-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0px 4px 6px -1px rgba(0,0,0,0.05), 0px 2px 4px -2px rgba(0,0,0,0.05);
  width: 405px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 555px;
  overflow-y: auto;
}

.details-heading h3 {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 18px;
  line-height: 28px;
  color: #1f2937;
  margin: 0;
}

.details-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1px;
}

.details-tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 8px 12px 10px 12px;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
}

.details-tab.active {
  color: #A8202D;
  border-bottom-color: #A8202D;
}

/* Info Section */
.info-section {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-item.text-right {
  align-items: flex-end;
}

.info-label {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #9ca3af;
}

.info-value {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #1f2937;
}

.info-value.primary {
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
}

.info-value.large {
  font-weight: 700;
  font-size: 30px;
  line-height: 36px;
}

.info-sublabel {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #9ca3af;
}

/* Findings List */
.findings-section {
  margin: 8px 0;
}

.findings-list {
  margin: 0;
  padding-left: 1.5em;
  list-style: disc;
}

.findings-list li {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #9ca3af;
  margin-bottom: 3.5px;
}

/* Primary Action Button */
.btn-primary-action {
  background: #A8202D;
  border: none;
  border-radius: 30px;
  padding: 10px 0;
  width: 100%;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary-action:hover {
  background: #8B1A24;
}

/* Additional Info */
.additional-info {
  border-top: 1px solid #e5e7eb;
  padding-top: 17px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Empty Selection */
.empty-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #9ca3af;
  font-family: 'Poppins', sans-serif;
}

/* ============================================================================
   REPORTS SECTION
   ============================================================================ */

.reports-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0px 4px 6px -1px rgba(0,0,0,0.05), 0px 2px 4px -2px rgba(0,0,0,0.05);
}

.reports-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.reports-header h3 {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 18px;
  line-height: 28px;
  color: #1f2937;
  margin: 0;
}

/* Reports Table */
.reports-table-header {
  display: flex;
  gap: 16px;
  padding: 8px;
  margin-bottom: 8px;
}

.report-col {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #9ca3af;
  width: 276px;
  flex-shrink: 0;
}

.reports-table-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 8px;
}

.report-row {
  display: flex;
  gap: 16px;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.report-row:hover {
  background: #f9fafb;
}

.report-row .report-col {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #1f2937;
  display: flex;
  align-items: center;
}

.report-name {
  font-weight: 500;
}

.report-row .actions-col {
  display: flex;
  gap: 8px;
}

.action-btn-sm {
  background: #f3f4f6;
  border: none;
  border-radius: 30px;
  padding: 6px 16px;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn-sm:hover {
  background: #e5e7eb;
}

/* Reports Footer */
.reports-footer {
  border-top: 1px solid #e5e7eb;
  padding-top: 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-note {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #9ca3af;
  margin: 0;
}

/* Sort Button Styles */
.sort-button {
  background: none;
  border: none;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  white-space: nowrap;
  width: 100%;
  justify-content: space-between;
}

.sort-button:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.sort-button.active {
  color: #A8202D;
}

.sort-icon {
  font-size: 12px;
  min-width: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.sort-icon.neutral {
  opacity: 0.6;
}

.sort-icon.asc {
  color: #A8202D;
}

.sort-icon.desc {
  color: #A8202D;
}

.btn-generate-report {
  background: #A8202D;
  border: none;
  border-radius: 30px;
  padding: 8px 20px;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-generate-report:hover {
  background: #8B1A24;
}

/* ============================================================================
   RESPONSIVE
   ============================================================================ */

@media (max-width: 1400px) {
  .admin-dashboard-container {
    padding: 2rem 100px;
  }
}

@media (max-width: 1200px) {
  .admin-dashboard-container {
    padding: 2rem 50px;
  }

  .statistics-cards {
    flex-wrap: wrap;
  }

  .records-management {
    flex-direction: column;
  }

  .report-details-card {
    width: 100%;
    max-width: none;
  }
}

@media (max-width: 768px) {
  .admin-dashboard-container {
    padding: 1rem;
  }

  .statistics-cards {
    flex-direction: column;
  }

  .stat-card,
  .stat-card-small {
    width: 100%;
  }

  .search-filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
  }

  .records-table-container {
    overflow-x: auto;
  }

  .table-header,
  .table-row {
    min-width: 700px;
  }

  .reports-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
`

// Create and inject style element
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

// Alert Component
function AlertMessage({ alerts }) {
  if (!alerts || alerts.length === 0) return null

  return (
    <div className="health-alerts">
      {alerts.map((alert, index) => (
        <div key={index} className={`alert alert-${alert.type}`}>
          <span className="alert-icon">
            {alert.type === 'error' ? '⚠' : 'i'}
          </span>
          <span className="alert-message">{alert.message}</span>
        </div>
      ))}
    </div>
  )
}

// Success Message Component
function SuccessMessage({ message }) {
  if (!message) return null

  return (
    <div className="success-message">
      <span className="success-icon">✓</span>
      <span>{message}</span>
    </div>
  )
}

// Error Message Component
function ErrorMessage({ error }) {
  if (!error) return null

  return (
    <div className="error-message">
      <span className="error-icon">✗</span>
      <span>{error}</span>
    </div>
  )
}

// Drag and Drop Area Component
function DragDropArea({ 
  isDragging, 
  onDragEnter, 
  onDragLeave, 
  onDragOver, 
  onDrop, 
  onFileSelect,
  file 
}) {
  const fileInputRef = useRef(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      onFileSelect(selectedFile)
    }
  }

  return (
    <div
      className={`drag-drop-area ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      
      <div className="drag-drop-content">
        <div className="drag-drop-icon">
          <img src={uploadIcon} alt="Upload" style={{width: '48px', height: '48px'}} />
        </div>
        <div className="drag-drop-text">
          {file ? (
            <>
              <div className="file-name">{file.name}</div>
              <div className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</div>
            </>
          ) : (
            <>
              <div>Drag and drop your health report here</div>
              <div className="drag-drop-subtext">or click to select</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Upload Modal Component
function UploadModal({
  show,
  uploadForm,
  isDragging,
  errors,
  onCancel,
  onUploadFormChange,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
  onSubmit,
  applicationId // Current applicationId from URL
}) {
  if (!show) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Upload Health Report</h3>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        
        <div className="modal-body">
          <p className="upload-subtitle">PDF, JPG up to 10MB</p>
          
          <DragDropArea
            isDragging={isDragging}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onFileSelect={onFileSelect}
            file={uploadForm.file}
          />

          {/* Show current application context if accessing from application page */}
          {applicationId && (
            <div className="form-group">
              <div className="info-box">
                <strong>Application Context:</strong> This health report will be associated with Application ID: {applicationId}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reportType">Report Type *</label>
            <select
              id="reportType"
              value={uploadForm.reportType}
              onChange={(e) => onUploadFormChange('reportType', e.target.value)}
              required
            >
              <option value="">Select report type</option>
              <option value="Medical Report">Medical Report</option>
              <option value="Lab Test">Lab Test</option>
              <option value="Prescription">Prescription</option>
              <option value="Vaccination Record">Vaccination Record</option>
              <option value="Doctor's Visit Summary">Doctor's Visit Summary</option>
            </select>
            {errors.reportType && <span className="error-text">{errors.reportType}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="reportDate">Report Date *</label>
            <input
              type="date"
              id="reportDate"
              value={uploadForm.reportDate}
              onChange={(e) => onUploadFormChange('reportDate', e.target.value)}
              required
            />
            {errors.reportDate && <span className="error-text">{errors.reportDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="reportTitle">Report Title *</label>
            <input
              type="text"
              id="reportTitle"
              placeholder="Enter a descriptive title for your report"
              value={uploadForm.reportTitle}
              onChange={(e) => onUploadFormChange('reportTitle', e.target.value)}
              required
            />
            {errors.reportTitle && <span className="error-text">{errors.reportTitle}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="providerName">Healthcare Provider *</label>
            <input
              type="text"
              id="providerName"
              placeholder="Name of the healthcare provider or facility"
              value={uploadForm.providerName}
              onChange={(e) => onUploadFormChange('providerName', e.target.value)}
              required
            />
            {errors.providerName && <span className="error-text">{errors.providerName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              placeholder="Additional notes about this report"
              value={uploadForm.notes}
              onChange={(e) => onUploadFormChange('notes', e.target.value)}
              rows="3"
            ></textarea>
            {errors.notes && <span className="error-text">{errors.notes}</span>}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onSubmit}>Upload Report</button>
        </div>
      </div>
    </div>
  )
}

// Share Modal Component
function ShareModal({
  show,
  shareForm,
  errors,
  onCancel,
  onShareFormChange,
  onShareFormSubmit
}) {
  if (!show) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share Health Report</h3>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>Select Sharing Option *</label>
            <div className="share-options">
              <button
                className={`share-option ${shareForm.shareOption === 'caregiver' ? 'active' : ''}`}
                onClick={() => onShareFormChange('shareOption', 'caregiver')}
              >
                <img src={caregiverIcon} alt="Caregiver" className="option-icon" />
                <span>Share with Caregiver</span>
              </button>
              
              <button
                className={`share-option ${shareForm.shareOption === 'family' ? 'active' : ''}`}
                onClick={() => onShareFormChange('shareOption', 'family')}
              >
                <img src={familyIcon} alt="Family" className="option-icon" />
                <span>Share with Family Member</span>
              </button>
              
              <button
                className={`share-option ${shareForm.shareOption === 'healthcare' ? 'active' : ''}`}
                onClick={() => onShareFormChange('shareOption', 'healthcare')}
              >
                <img src={healthcareProviderIcon} alt="Healthcare Provider" className="option-icon" />
                <span>Share with Healthcare Provider</span>
              </button>
              
              <button
                className={`share-option ${shareForm.shareOption === 'link' ? 'active' : ''}`}
                onClick={() => onShareFormChange('shareOption', 'link')}
              >
                <img src={shareLinkIcon} alt="Share Link" className="option-icon" />
                <span>Copy Share Link</span>
              </button>

              <button
                className={`share-option ${shareForm.shareOption === 'email' ? 'active' : ''}`}
                onClick={() => onShareFormChange('shareOption', 'email')}
              >
                <span className="option-icon">✉</span>
                <span>Share via Email</span>
              </button>
              
              <button
                className={`share-option ${shareForm.shareOption === 'download' ? 'active' : ''}`}
                onClick={() => onShareFormChange('shareOption', 'download')}
              >
                <img src={downloadIcon} alt="Download" className="option-icon" />
                <span>Download as PDF</span>
              </button>
            </div>
          </div>

          {(shareForm.shareOption === 'caregiver' || shareForm.shareOption === 'family' || shareForm.shareOption === 'healthcare' || shareForm.shareOption === 'email') && (
            <>
              <div className="form-group">
                <label htmlFor="shareEmail">Email Address *</label>
                <input
                  type="email"
                  id="shareEmail"
                  value={shareForm.email}
                  onChange={(e) => onShareFormChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
                {errors.shareEmail && <span className="error-text">{errors.shareEmail}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="expiryDays">Link Expires In (Days)</label>
                <select
                  id="expiryDays"
                  value={shareForm.expiryDays}
                  onChange={(e) => onShareFormChange('expiryDays', parseInt(e.target.value))}
                >
                  <option value={1}>1 Day</option>
                  <option value={7}>7 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days</option>
                </select>
              </div>
            </>
          )}

          {shareForm.shareOption === 'link' && (
            <div className="form-group">
              <label htmlFor="expiryDays">Link Expires In (Days)</label>
              <select
                id="expiryDays"
                value={shareForm.expiryDays}
                onChange={(e) => onShareFormChange('expiryDays', parseInt(e.target.value))}
              >
                <option value={1}>1 Day</option>
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onShareFormSubmit}>Share</button>
        </div>
      </div>
    </div>
  )
}

// Reminder Modal Component
function ReminderModal({
  show,
  reminderForm,
  editingReminder,
  errors,
  onCancel,
  onFormChange,
  onSubmit
}) {
  if (!show) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content reminder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingReminder ? 'Edit Reminder' : 'Create New Reminder'}</h3>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="reminderTitle">Reminder Title *</label>
            <input
              type="text"
              id="reminderTitle"
              value={reminderForm?.reminder_title || ''}
              onChange={(e) => onFormChange?.('reminder_title', e.target.value)}
              placeholder="Enter reminder title"
            />
            {errors?.reminder_title && <span className="error-text">{errors.reminder_title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="reminderType">Reminder Type *</label>
            <select
              id="reminderType"
              value={reminderForm?.reminder_type || 'Next health check'}
              onChange={(e) => onFormChange?.('reminder_type', e.target.value)}
            >
              <option value="Next health check">Next health check</option>
              <option value="Medication refill">Medication refill</option>
              <option value="Blood pressure check">Blood pressure check</option>
              <option value="Doctor visit">Doctor visit</option>
              <option value="Vaccination">Vaccination</option>
              <option value="Lab test">Lab test</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reminderDate">Date *</label>
            <input
              type="date"
              id="reminderDate"
              value={reminderForm?.reminder_date || ''}
              onChange={(e) => onFormChange?.('reminder_date', e.target.value)}
            />
            {errors?.reminder_date && <span className="error-text">{errors.reminder_date}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="reminderTime">Time *</label>
            <input
              type="time"
              id="reminderTime"
              value={reminderForm?.reminder_time || ''}
              onChange={(e) => onFormChange?.('reminder_time', e.target.value)}
            />
            {errors?.reminder_time && <span className="error-text">{errors.reminder_time}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={reminderForm?.category || 'Health & appointments'}
              onChange={(e) => onFormChange?.('category', e.target.value)}
            >
              <option value="Health & appointments">Health & appointments</option>
              <option value="Medication">Medication</option>
              <option value="Personal">Personal</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              value={reminderForm?.notes || ''}
              onChange={(e) => onFormChange?.('notes', e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={reminderForm?.is_enabled ?? true}
                onChange={(e) => onFormChange?.('is_enabled', e.target.checked)}
              />
              <span className="checkmark"></span>
              Enable this reminder
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onSubmit}>
            {editingReminder ? 'Update Reminder' : 'Create Reminder'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ADMIN VIEW COMPONENT
// ============================================================================

function AdminHealthReportDashboardView({
  // State
  isLoading,
  statistics,
  reports,
  selectedReport,
  alerts,
  error,
  successMessage,
  searchKey,
  filters,
  sortBy,
  sortOrder,
  activeTab,
  showApprovalConfirm,
  showArchiveConfirm,
  showFlagModal,
  flagReason,
  actionReport,

  // Handlers
  onSearchChange,
  onFilterChange,
  onSort,
  onReportSelect,
  onApproveClick,
  onApproveConfirm,
  onFlagClick,
  onFlagConfirm,
  onArchiveClick,
  onArchiveConfirm,
  onCancelAdminAction,
  onFlagReasonChange,
  onViewReport,
  onTabChange
}) {
  // Loading state
  if (isLoading) {
    return (
      <div className="admin-dashboard-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading health reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard-container">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="alert alert-success">
          <span>✓</span> {successMessage}
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Heading */}
        <div className="section-heading">
          <h1>Health Report Dashboard</h1>
        </div>

        {/* Statistics Cards */}
        <div className="statistics-cards">
          <div className="stat-card">
            <div className="stat-label">Pending Reports</div>
            <div className="stat-value">{statistics?.pending || 0}</div>
            <div className="stat-sublabel">Awaiting review</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Approved</div>
            <div className="stat-value">{statistics?.approved || 0}</div>
            <div className="stat-sublabel">Active health records</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Flagged</div>
            <div className="stat-value">{statistics?.flagged || 0}</div>
            <div className="stat-sublabel">Requires attention</div>
          </div>

          <div className="stat-card stat-card-small">
            <div className="stat-label">Reports Generated</div>
            <div className="stat-value">{statistics?.generated || 0}</div>
            <div className="stat-sublabel">This month</div>
          </div>
        </div>

        {/* Records Management Section */}
        <div className="records-management">
          {/* Records Table */}
          <div className="records-table-container">
            <div className="table-heading">
              <h3>Records</h3>
            </div>

            {/* Search and Filters */}
            <div className="search-filter-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Search applicants, reports, IDs"
                value={searchKey}
                onChange={(e) => onSearchChange(e.target.value)}
              />

              <div className="filter-group">
                <span className="filter-label">Filter field:</span>
                <select
                  className="filter-select"
                  value={filters.field || 'status'}
                  onChange={(e) => onFilterChange('field', e.target.value)}
                >
                  <option value="status">Status</option>
                  <option value="reportType">Report Type</option>
                  <option value="date">Date</option>
                </select>
              </div>

              <div className="filter-group">
                <span className="filter-label">Value:</span>
                <select
                  className="filter-select"
                  value={filters.value || 'pending'}
                  onChange={(e) => onFilterChange('value', e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>

              <div className="filter-group">
                <span className="filter-label">Sort:</span>
                <select
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => onSort(e.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>

            {/* Record Type Tabs */}
            <div className="record-tabs">
              <button
                className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => onTabChange('reports')}
              >
                Health Reports
              </button>
              <button
                className={`tab-button ${activeTab === 'patients' ? 'active' : ''}`}
                onClick={() => onTabChange('patients')}
              >
                Patients
              </button>
              <div className="tab-info">
                Use filters to refine by status, dates, report type and more.
              </div>
            </div>

            {/* Table Headers */}
            <div className="table-header">
              <div className="table-col">Applicant</div>
              <div className="table-col">Report Type</div>
              <div className="table-col">Submitted</div>
              <div className="table-col">Status</div>
              <div className="table-col">Actions</div>
            </div>

            {/* Table Rows */}
            <div className="table-body">
              {reports && reports.length > 0 ? (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className={`table-row ${selectedReport?.id === report.id ? 'selected' : ''}`}
                    onClick={() => onReportSelect(report)}
                  >
                    <div className="table-col">
                      <span className="applicant-name">
                        {report.applications?.users?.full_name || 
                         report.users?.full_name || 
                         'N/A'}
                      </span>
                    </div>
                    <div className="table-col">
                      <span className="report-type">{report.report_type || 'General'}</span>
                    </div>
                    <div className="table-col">
                      <span className="date">
                        {new Date(report.created_at || report.report_date).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <div className="table-col">
                      <span className={`status-badge status-${(report.health_report_status || 'pending').toLowerCase()}`}>
                        {(report.health_report_status || 'Pending').charAt(0).toUpperCase() + (report.health_report_status || 'pending').slice(1).toLowerCase()}
                      </span>
                    </div>
                    <div className="table-col actions-col">
                      {(report.health_report_status || 'pending').toLowerCase() === 'pending' && (
                        <>
                          <button
                            className="action-btn approve-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              onApproveClick(report)
                            }}
                            title="Approve Report"
                          >
                            Approve
                          </button>
                          <button
                            className="action-btn flag-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              onFlagClick(report)
                            }}
                            title="Flag Report"
                          >
                            Flag
                          </button>
                        </>
                      )}
                      <button
                        className="action-btn view-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewReport(report.id)
                        }}
                        title="View Report"
                      >
                        View
                      </button>
                      <button
                        className="action-btn archive-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onArchiveClick(report)
                        }}
                        title="Archive Report"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No health reports found</p>
                </div>
              )}
            </div>
          </div>

          {/* Report Details Card */}
          <div className="report-details-card">
            <div className="details-heading">
              <h3>Report Details</h3>
            </div>

            <div className="details-tabs">
              <button className="details-tab active">Overview</button>
              <button className="details-tab">Documents</button>
              <button className="details-tab">History</button>
            </div>

            {selectedReport ? (
              <>
                {/* Applicant and Report Info */}
                <div className="info-section">
                  <div className="info-group">
                    <div className="info-item">
                      <div className="info-label">Applicant</div>
                      <div className="info-value primary">
                        {selectedReport.applications?.users?.full_name || 
                         selectedReport.users?.full_name || 
                         'N/A'}
                      </div>
                      <div className="info-sublabel">
                        IC: {selectedReport.applications?.users?.ic_number || 
                             selectedReport.users?.ic_number || 
                             'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="info-group">
                    <div className="info-item text-right">
                      <div className="info-label">Report Type</div>
                      <div className="info-value primary">{selectedReport.report_type || 'General'}</div>
                      <div className="info-sublabel">
                        Date: {selectedReport.report_date ? 
                               new Date(selectedReport.report_date).toLocaleDateString('en-GB') : 
                               'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Healthcare Provider */}
                <div className="info-section">
                  <div className="info-label">Healthcare Provider</div>
                  <div className="info-value large">{selectedReport.provider_name || 'N/A'}</div>
                  <div className="info-sublabel">{selectedReport.provider_address || 'Address not provided'}</div>
                </div>

                {/* Key Findings */}
                <div className="findings-section">
                  <ul className="findings-list">
                    <li>Report uploaded and verified</li>
                    <li>Medical history reviewed</li>
                    <li>No risk flags detected</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <button className="btn-primary-action">Approve Report</button>

                {/* Additional Info */}
                <div className="additional-info">
                  <div className="info-row">
                    <div className="info-col">
                      <div className="info-label">Notes</div>
                      <div className="info-sublabel">{selectedReport.notes || 'No additional notes'}</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-selection">
                <p>Select a report to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Reports Section */}
        <div className="reports-section">
          <div className="reports-header">
            <h3>Reports</h3>
            <div className="filter-group">
              <span className="filter-label">Filter</span>
              <select className="filter-select">
                <option>This month</option>
                <option>Last month</option>
                <option>This year</option>
              </select>
            </div>
          </div>

          {/* Reports Table */}
          <div className="reports-table">
            <div className="reports-table-header">
              <div className="report-col">Report name</div>
              <div className="report-col">Generated on</div>
              <div className="report-col"></div>
              <div className="report-col">Actions</div>
            </div>

            <div className="reports-table-body">
              <div className="report-row">
                <div className="report-col">
                  <span className="report-name">Health Report - Nov 2025</span>
                </div>
                <div className="report-col">
                  <span className="report-date">01 Dec 2025</span>
                </div>
                <div className="report-col"></div>
                <div className="report-col actions-col">
                  <button className="action-btn-sm" onClick={() => onViewReport('report-1')}>View</button>
                  <button className="action-btn-sm" onClick={() => onShareReport('report-1')}>Share</button>
                  <button className="action-btn-sm" onClick={() => onArchiveReport('report-1')}>Archive</button>
                </div>
              </div>

              <div className="report-row">
                <div className="report-col">
                  <span className="report-name">Health Report - OCT 2025</span>
                </div>
                <div className="report-col">
                  <span className="report-date">28 Nov 2025</span>
                </div>
                <div className="report-col"></div>
                <div className="report-col actions-col">
                  <button className="action-btn-sm" onClick={() => onViewReport('report-2')}>View</button>
                  <button className="action-btn-sm" onClick={() => onShareReport('report-2')}>Share</button>
                  <button className="action-btn-sm" onClick={() => onArchiveReport('report-2')}>Archive</button>
                </div>
              </div>

              <div className="report-row">
                <div className="report-col">
                  <span className="report-name">Health Report - Sep 2025</span>
                </div>
                <div className="report-col">
                  <span className="report-date">30 Sep 2025</span>
                </div>
                <div className="report-col"></div>
                <div className="report-col actions-col">
                  <button className="action-btn-sm" onClick={() => onViewReport('report-3')}>View</button>
                  <button className="action-btn-sm" onClick={() => onShareReport('report-3')}>Share</button>
                  <button className="action-btn-sm" onClick={() => onArchiveReport('report-3')}>Archive</button>
                </div>
              </div>
            </div>
          </div>

          {/* Generate Report Footer */}
          <div className="reports-footer">
            <p className="footer-note">Store and access reports securely for audit and Compliance.</p>
            <button className="btn-generate-report" onClick={onGenerateReport}>
              Generate Health Analysis Report (PDF)
            </button>
          </div>
        </div>
      </div>

      {/* Admin Modals */}
      
      {/* Approval Confirmation Modal */}
      {showApprovalConfirm && actionReport && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Approve Health Report</h3>
            <p>Are you sure you want to approve this health report?</p>
            <div className="report-preview">
              <p><strong>Report Type:</strong> {actionReport.report_type}</p>
              <p><strong>Date:</strong> {new Date(actionReport.report_date).toLocaleDateString('en-GB')}</p>
              <p><strong>Notes:</strong> {actionReport.notes || 'No notes'}</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={onCancelAdminAction}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={onApproveConfirm}>
                Approve Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {showFlagModal && actionReport && (
        <div className="modal-overlay">
          <div className="modal flag-modal">
            <h3>Flag Health Report</h3>
            <p>Please provide a reason for flagging this report:</p>
            <div className="report-preview">
              <p><strong>Report Type:</strong> {actionReport.report_type}</p>
              <p><strong>Date:</strong> {new Date(actionReport.report_date).toLocaleDateString('en-GB')}</p>
              <p><strong>Provider:</strong> {actionReport.provider_name || 'N/A'}</p>
            </div>
            <textarea
              className="flag-reason-input"
              placeholder="Enter reason for flagging (required)"
              value={flagReason}
              onChange={(e) => onFlagReasonChange(e.target.value)}
              rows={4}
              required
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={onCancelAdminAction}>
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={onFlagConfirm}
                disabled={!flagReason.trim()}
              >
                Flag Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && actionReport && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Archive Health Report</h3>
            <p>Are you sure you want to archive this health report?</p>
            <div className="report-preview">
              <p><strong>Report Type:</strong> {actionReport.report_type}</p>
              <p><strong>Date:</strong> {new Date(actionReport.report_date).toLocaleDateString('en-GB')}</p>
              <p><strong>Provider:</strong> {actionReport.provider_name || 'N/A'}</p>
              <p><strong>Notes:</strong> {actionReport.notes || 'No notes'}</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={onCancelAdminAction}>
                Cancel
              </button>
              <button className="btn btn-warning" onClick={onArchiveConfirm}>
                Archive Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// USER VIEW COMPONENT
// ============================================================================

function UserHealthReportView({
  // State
  alerts,
  successMessage,
  errorMessage,
  reports,
  uploadForm,
  shareForm,
  multiUploadForm,
  searchKey,
  filters,
  sortBy,
  sortOrder,
  showUploadModal,
  showShareModal,
  showPDFViewer,
  viewingReportUrl,
  showFilters,
  showSort,
  isDragging,
  errors,
  activeTab = 'archived',
  statistics,
  user, // Add user prop for accessing current user info
  applicationId, // Add applicationId prop

  // Reminder props
  reminders,
  upcomingReminders,
  overdueReminders,
  reminderStats,
  showReminderModal,
  reminderForm,
  editingReminder,

  // Handlers
  onUploadClick,
  onCancelUploadModal,
  onClosePDFViewer,
  onUploadFormChange,
  onMultiUploadFormChange,
  onMultipleFileUpload,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
  onUploadSubmit,
  onCancelShareModal,
  onShareFormChange,
  onShareFormSubmit,
  onSearchChange,
  onSearch,
  onFilterChange,
  onClearFilters,
  onTabFilter,
  onFilter,
  onSetShowFilters,
  onSetShowSort,
  onSort,
  onDownload,
  onShareClick,
  onDelete,
  onTabChange,
  onViewReport,
  onCreateReminder,
  onEditReminder,
  onDeleteReminder,
  onToggleReminder,
  onReminderFormChange,
  onSubmitReminder,
  onCancelReminderModal
}) {
  // Add default values to prevent undefined errors
  const defaultStatistics = {
    reminderThisWeek: 0,
    overdueHealthReport: 0,
    healthReportDueSoon: 0,
    flaggedHealthReport: 0
  };
  
  const safeStatistics = {
    ...defaultStatistics,
    ...(statistics && typeof statistics === 'object' ? statistics : defaultStatistics)
  };

  // Safe event handlers with default functions
  const safeOnDragEnter = onDragEnter || ((e) => e.preventDefault());
  const safeOnDragLeave = onDragLeave || ((e) => e.preventDefault());
  const safeOnDragOver = onDragOver || ((e) => e.preventDefault());
  const safeOnDrop = onDrop || ((e) => e.preventDefault());
  const safeOnFileSelect = onFileSelect || (() => {});
  const safeOnUploadSubmit = onUploadSubmit || (() => {});
  const safeOnSearchChange = onSearchChange || (() => {});

  // Local state for managing selected files
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState({ fileNames: '', fileCount: 0 });
  const [showDatePicker, setShowDatePicker] = useState({ start: false, end: false });
  const [selectedDates, setSelectedDates] = useState({ startDate: '', endDate: '' });

  // File input ref for programmatic file selection
  const fileInputRef = useRef(null);

  // Enhanced drag handlers for full-page detection
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only activate on first enter with files
    if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only deactivate when leaving the entire window
    // Check if the relatedTarget is null (leaving window) or not a child element
    if (!e.relatedTarget || (!document.body.contains(e.relatedTarget))) {
      setIsDragActive(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Ensure dataTransfer effect is set to allow drop
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFilesSelected(files);
    }
  };

  // Helper functions for date picker
  const getUserJoinDate = () => {
    // Default to 1 year ago if no user join date is available
    if (user && user.created_at) {
      return new Date(user.created_at).toISOString().split('T')[0];
    }
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return oneYearAgo.toISOString().split('T')[0];
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  const handleCalendarClick = (type) => {
    setShowDatePicker(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleDateSelect = (type, value) => {
    const dateField = type === 'start' ? 'startDate' : 'endDate';
    const newDates = { ...selectedDates, [dateField]: value };
    setSelectedDates(newDates);
    
    // Update filters using the filter change handler
    if (onFilterChange) {
      onFilterChange(dateField, value);
    }
    
    // Only close the date picker if a complete date is selected
    // Check if the value is a complete date (YYYY-MM-DD format)
    if (value && value.length === 10 && value.includes('-')) {
      setShowDatePicker(prev => ({ ...prev, [type]: false }));
    }
  };

  // Close date picker when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on the input field, calendar icon, or dropdown
      if (!event.target.closest('.date-input-wrapper') && 
          !event.target.closest('.date-picker-dropdown') &&
          !event.target.matches('input[type="date"]')) {
        setShowDatePicker({ start: false, end: false });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Add window-level event listeners for better drag detection
  React.useEffect(() => {
    const handleWindowDragEnter = (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
        setIsDragActive(true);
      }
    };

    const handleWindowDragLeave = (e) => {
      e.preventDefault();
      // Only hide overlay if mouse leaves the entire window
      if (e.clientX === 0 || e.clientY === 0 || e.clientX === window.innerWidth || e.clientY === window.innerHeight) {
        setIsDragActive(false);
      }
    };

    const handleWindowDrop = (e) => {
      e.preventDefault();
      setIsDragActive(false);
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);
    window.addEventListener('dragover', (e) => e.preventDefault());

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
      window.removeEventListener('dragover', (e) => e.preventDefault());
    };
  }, []);

  // File selection handler with PDF conversion logic
  const handleFilesSelected = async (files) => {
    const processedFiles = [];
    const imageFiles = [];
    
    console.log('📁 Processing', files.length, 'selected files...');
    
    // Separate files into PDFs and images with enhanced validation
    for (const file of files) {
      try {
        console.log('🔍 Validating file:', file.name);
        const validation = await validateHealthReportFile(file);
        
        if (!validation.valid) {
          alert(`❌ Invalid file "${file.name}": ${validation.error}`);
          continue;
        }
        
        if (validation.willCompress) {
          console.log('📦 File will be compressed:', file.name);
        }
        
        if (isPDFFile(file)) {
          processedFiles.push(file);
          console.log('✅ PDF file validated:', file.name);
        } else if (isImageFile(file)) {
          imageFiles.push(file);
          console.log('🖼️ Image file will be converted:', file.name);
        }
      } catch (error) {
        console.error('❌ File validation error:', error);
        alert(`Error validating file "${file.name}": ${error.message}`);
      }
    }
    
    // If there are image files, ask user if they want to convert to PDF
    if (imageFiles.length > 0) {
      const convertToPDF = window.confirm(
        `You've selected ${imageFiles.length} image file(s). Health reports must be in PDF format. ` +
        `Would you like the system to convert these images into a PDF document?`
      );
      
      if (convertToPDF) {
        try {
          setIsConverting(true);
          const fileName = `health_report_${Date.now()}.pdf`;
          const convertedPDF = await convertImagesToPDF(imageFiles, fileName);
          processedFiles.push(convertedPDF);
          
          alert(
            `Successfully converted ${imageFiles.length} image(s) to PDF: ${fileName}`
          );
        } catch (error) {
          console.error('PDF conversion failed:', error);
          alert('Failed to convert images to PDF. Please try again or upload a PDF file directly.');
          return;
        } finally {
          setIsConverting(false);
        }
      } else {
        alert('Please upload PDF files only for health reports.');
        return;
      }
    }
    
    if (processedFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...processedFiles]);
      // Call the original handler with the first file for backwards compatibility
      if (safeOnFileSelect) {
        safeOnFileSelect(processedFiles[0]);
      }
    }
  };

  const onFileInputChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      await handleFilesSelected(files);
    }
  };

  // Enhanced file select handler that triggers file input
  const handleFileSelect = () => {
    if (fileInputRef.current && !isConverting) {
      fileInputRef.current.click();
    }
  };

  // Remove file from selection
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Submit function that calls controller method
  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file to upload.');
      return;
    }

    if (!user || !user.id) {
      alert('User not authenticated. Please log in and try again.');
      return;
    }

    try {
      // Call controller method to handle business logic
      const result = await onMultipleFileUpload?.(selectedFiles);
      
      if (result?.success) {
        // Show success message and clear files
        const fileNames = selectedFiles.map(f => f.name).join(', ');
        setSuccessModalData({
          fileNames,
          fileCount: selectedFiles.length
        });
        setShowSuccessModal(true);
        
        // Auto-hide modal after 4 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 4000);
        
        // Clear selected files and reset form
        setSelectedFiles([]);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        // Show error in UI
        setSuccessModalData({
          error: true,
          message: result?.error || 'Upload failed. Please try again.'
        });
        setShowSuccessModal(true);
        
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 4000);
      }
    } catch (error) {
      console.error('Upload process failed:', error);
      setSuccessModalData({
        error: true,
        message: `Upload failed: ${error.message || 'An unexpected error occurred. Please try again.'}`
      });
      setShowSuccessModal(true);
      
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 4000);
    }
  };

  // Archived reports from the actual reports prop
  const archivedReports = reports || [];

  return (
    <div className={`health-report-container ${isDragActive ? 'drag-active' : ''}`}>
      {/* Full Page Drop Overlay */}
      {isDragActive && (
        <div 
          className="full-page-drop-overlay"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="full-page-drop-content">
            <div className="full-page-drop-icon">📁</div>
            <h2>Drop your files here</h2>
            <p>Release to upload your health reports</p>
          </div>
        </div>
      )}
      
      <div className="health-report-content">
        {/* Success Modal */}
        {showSuccessModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button 
                className="modal-close"
                onClick={() => setShowSuccessModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
              <div className="modal-checkmark">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="11" fill={successModalData.error ? "#ef4444" : "#22c55e"} stroke="none"/>
                  {successModalData.error ? (
                    <path d="M8 8L16 16M8 16L16 8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  ) : (
                    <path d="M7 12.5L10.5 16L17 8" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  )}
                </svg>
              </div>
              <h2 className="modal-title" style={{ color: successModalData.error ? '#ef4444' : '#22c55e' }}>
                {successModalData.error ? 'Upload Failed' : 'Upload Successful!'}
              </h2>
              <p className="modal-message">
                {successModalData.error ? successModalData.message : `Successfully uploaded ${successModalData.fileCount} health report${successModalData.fileCount > 1 ? 's' : ''}!`}
              </p>
              {!successModalData.error && successModalData.fileNames && (
                <div className="modal-file-list">
                  <strong>Files uploaded:</strong><br/>
                  {successModalData.fileNames}
                </div>
              )}
              {!successModalData.error && (
                <p className="modal-message" style={{fontSize: '14px', color: '#666', marginTop: '10px'}}>
                  Your reports are now under review and will appear in your health records.
                </p>
              )}
            </div>
          </div>
        )}
        {/* Alerts and Messages */}
        {alerts && alerts.length > 0 && <AlertMessage alerts={alerts} />}
        {successMessage && <SuccessMessage message={successMessage} />}
        {errorMessage && <ErrorMessage error={errorMessage} />}

        {/* Statistics Cards Section */}
        <div className="statistics-section">
          <div className="statistics-cards">
            <div className="stat-card">
              <div className="stat-label">Reminder this week</div>
              <div className="stat-value">{safeStatistics.reminderThisWeek || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Overdue Health Report</div>
              <div className="stat-value">{safeStatistics.overdueHealthReport || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Health Report Due Soon</div>
              <div className="stat-value">{safeStatistics.healthReportDueSoon || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Flagged Health Report</div>
              <div className="stat-value">{safeStatistics.flaggedHealthReport || 0}</div>
            </div>
          </div>
        </div>

        {/* Upload Health Report Section - Compact */}
        <div className="upload-section-compact">
          <div className="upload-card">
            <h3>Upload Health Report</h3>
            <p className="upload-subtitle">PDF, JPG up to 10MB</p>
            
            {/* Form fields for report type and date */}
            <div className="upload-form-fields" style={{ marginBottom: '1.5rem' }}>
              <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="reportType" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Report Type *</label>
                  <select
                    id="reportType"
                    value={multiUploadForm?.reportType || ''}
                    onChange={(e) => onMultiUploadFormChange?.('reportType', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                    required
                  >
                    <option value="">Select report type</option>
                    <option value="Medical Report">Medical Report</option>
                    <option value="Lab Test">Lab Test</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Vaccination Record">Vaccination Record</option>
                    <option value="Doctor's Visit Summary">Doctor's Visit Summary</option>
                    <option value="Medical Image">Medical Image</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="reportDate" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Report Date *</label>
                  <input
                    type="date"
                    id="reportDate"
                    value={multiUploadForm?.reportDate || ''}
                    onChange={(e) => onMultiUploadFormChange?.('reportDate', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                    required
                  />
                </div>
              </div>
              
              {/* Custom report type field for "Others" */}
              {multiUploadForm?.reportType === 'Others' && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="customReportType" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Custom Report Type *</label>
                  <input
                    type="text"
                    id="customReportType"
                    placeholder="Please specify the report type"
                    value={multiUploadForm?.customReportType || ''}
                    onChange={(e) => onMultiUploadFormChange?.('customReportType', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                    required
                  />
                </div>
              )}

              {/* Report Title field */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="reportTitle" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Report Title *</label>
                <input
                  type="text"
                  id="reportTitle"
                  placeholder="Enter a descriptive title for your reports"
                  value={multiUploadForm?.reportTitle || ''}
                  onChange={(e) => onMultiUploadFormChange?.('reportTitle', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                  required
                />
              </div>

              {/* Provider Name field */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="providerName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Healthcare Provider *</label>
                <input
                  type="text"
                  id="providerName"
                  placeholder="Name of the healthcare provider or facility"
                  value={multiUploadForm?.providerName || ''}
                  onChange={(e) => onMultiUploadFormChange?.('providerName', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                  required
                />
              </div>

              {/* Show current application context if accessing from application page */}
              {applicationId && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#e8f4fd',
                    border: '1px solid #bee5eb',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}>
                    <strong>Application Context:</strong> These health reports will be associated with Application ID: {applicationId}
                  </div>
                </div>
              )}
            </div>
            
            <div 
              className={`upload-drop-area ${isDragActive ? 'dragging' : ''} ${selectedFiles.length > 0 ? 'has-files' : ''} ${isConverting ? 'converting' : ''}`}
              onClick={isConverting ? undefined : handleFileSelect}
            >
              {isConverting ? (
                <>
                  <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                  <p>Converting images to PDF...</p>
                  <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.5rem 0 0 0' }}>
                    Please wait while we process your files
                  </p>
                </>
              ) : (
                <>
                  <img src={uploadIcon} alt="Upload" className="upload-icon" />
                  <p>Drag and drop files here or click to browse</p>
                  <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.5rem 0 0 0' }}>
                    <strong>PDF files only</strong> - Images will be converted to PDF automatically
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#888', margin: '0.25rem 0 0 0' }}>
                    Maximum 10MB per file (Multiple files supported)
                  </p>
                </>
              )}
            </div>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={onFileInputChange}
            />

            {/* File Preview Section */}
            {selectedFiles.length > 0 && (
              <div className="file-preview-section">
                <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                  Selected Files ({selectedFiles.length})
                </h4>
                <div className="file-preview-list">
                  {selectedFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="file-preview-item">
                      <div className="file-icon">
                        📄
                      </div>
                      <div className="file-info">
                        <div className="file-name" title={file.name}>{file.name}</div>
                        <div className="file-size">{formatFileSize(file.size)}</div>
                      </div>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => removeFile(index)}
                        title="Remove file"
                        disabled={isConverting}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              className="btn btn-primary btn-submit" 
              onClick={handleSubmit}
              disabled={selectedFiles.length === 0 || isConverting}
              style={{
                opacity: selectedFiles.length === 0 || isConverting ? 0.6 : 1,
                cursor: selectedFiles.length === 0 || isConverting ? 'not-allowed' : 'pointer'
              }}
            >
              {isConverting ? 'Converting...' : `Submit (${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''})`}
            </button>
          </div>
        </div>

        {/* Health Monitoring Section */}
        <div className="health-monitoring-section">
          <div className="reminders-card">
            <div className="reminders-header">
              <h3>Reminders</h3>
              <span className="tab-indicator">Health & appointments</span>
              <button 
                className="btn-add-reminder" 
                onClick={() => onCreateReminder?.()}
                style={{
                  marginLeft: 'auto',
                  padding: '0.5rem 1rem',
                  background: '#A8202D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                + Add Reminder
              </button>
            </div>

            {upcomingReminders && upcomingReminders.length > 0 ? (
              upcomingReminders.slice(0, 2).map((reminder) => (
                <div key={reminder.id} className="reminder-item">
                  <div className="reminder-content">
                    <div className="reminder-title">{reminder.reminder_title || reminder.reminder_type}</div>
                    <div className="reminder-description">
                      {new Date(reminder.reminder_date).toLocaleDateString('en-GB')} at{' '}
                      {new Date(reminder.reminder_date).toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {(() => {
                        const now = new Date();
                        const reminderDate = new Date(reminder.reminder_date);
                        const diffTime = reminderDate - now;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays > 0 ? ` (${diffDays} days left)` : '';
                      })()}
                    </div>
                  </div>
                  <div className="reminder-toggle">
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={reminder.is_enabled || false}
                        onChange={(e) => onToggleReminder?.(reminder.id, e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <button 
                    className="btn-edit"
                    onClick={() => onEditReminder?.(reminder)}
                    style={{
                      marginLeft: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      background: 'transparent',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    Edit
                  </button>
                </div>
              ))
            ) : (
              <div className="reminder-item">
                <div className="reminder-content">
                  <div className="reminder-title">No upcoming reminders</div>
                  <div className="reminder-description">Click "Add Reminder" to set up health reminders</div>
                </div>
                <button 
                  className="btn-add-first"
                  onClick={() => onCreateReminder?.()}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f8f9fa',
                    border: '1px solid #A8202D',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: '#A8202D'
                  }}
                >
                  Add Reminder
                </button>
              </div>
            )}

            <div className="reminder-tags">
              <span className="reminder-tag">Medication refill</span>
              <span className="reminder-tag">Blood pressure check</span>
              <span className="reminder-tag">Doctor visit</span>
            </div>
          </div>

          <div className="archived-reports-card">
            <div className="archived-header">
              <h3>Archived Health Reports</h3>
              <button className="btn-view-all">View all</button>
            </div>

            <div className="archived-table">
              <div className="table-header">
                <div className="table-col">Type</div>
                <div className="table-col">Date</div>
                <div className="table-col">Actions</div>
              </div>

              {archivedReports.length > 0 ? archivedReports.map((report) => (
                <div key={report.id} className="table-row">
                  <div className="table-col">{report.report_type || 'Medical Report'}</div>
                  <div className="table-col">{new Date(report.report_date).toLocaleDateString('en-GB')}</div>
                  <div className="table-col table-actions">
                    <button 
                      className="btn-action"
                      onClick={() => onDownload?.(report.id)}
                    >
                      View
                    </button>
                    <button 
                      className="btn-action"
                      onClick={() => onShareClick?.(report)}
                    >
                      Share
                    </button>
                  </div>
                </div>
              )) : (
                <div className="table-row">
                  <div className="table-col" style={{textAlign: 'center', padding: '20px', color: '#666'}}>No reports available</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Health Report Section */}
        <div className="search-section">
          <div className="search-header">
            <h2>Health report search</h2>
            <button 
              className="btn-clear-filters"
              onClick={onClearFilters}
            >
              Clear all filters
            </button>
          </div>

          {/* Search Bar */}
          <div className="search-bar-container">
            <div className="search-input-group">
              <div className="search-input">
                <img src={searchIcon} alt="Search" className="search-icon" style={{filter: 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)', marginLeft: '12px'}} />
                <input 
                  type="text" 
                  placeholder="Search health reports, providers, titles"
                  value={searchKey || ''}
                  onChange={safeOnSearchChange}
                />
                <button className="clear-search">×</button>
              </div>
              
              <button 
                className="btn-filter"
                onClick={() => {
                  if (showSort) {
                    onSetShowSort?.(false)
                  }
                  onSetShowFilters?.(!showFilters)
                }}
              >
                <img src={filterIcon} alt="Filter" style={{filter: 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)'}} />
                {showFilters ? 'Hide' : 'Show'} Filter
              </button>
              
              <button 
                className="btn-sort"
                onClick={() => {
                  if (showFilters) {
                    onSetShowFilters?.(false)
                  }
                  onSetShowSort?.(!showSort)
                }}
              >
                <img src={sortIcon} alt="Sort" style={{filter: 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)'}} />
                {showSort ? 'Hide' : 'Show'} Sort
              </button>
            </div>

            <div className="filter-buttons">
              <button 
                className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => onTabFilter?.('all')}
              >
                All
              </button>
              <button 
                className={`filter-btn ${activeTab === 'overdue' ? 'active' : ''}`}
                onClick={() => onTabFilter?.('overdue')}
              >
                Overdue
              </button>
              <button 
                className={`filter-btn ${activeTab === 'due-soon' ? 'active' : ''}`}
                onClick={() => onTabFilter?.('due-soon')}
              >
                Due Soon
              </button>
              <button 
                className={`filter-btn ${activeTab === 'up-to-date' ? 'active' : ''}`}
                onClick={() => onTabFilter?.('up-to-date')}
              >
                Up to Date
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="advanced-filters">
              <div className="filter-row">
              <div className="filter-group">
                <label>Report Type</label>
                <div className="filter-options">
                  <button 
                    className={`filter-option ${!filters?.reportType || filters.reportType === 'Medical Report' ? 'active' : ''}`}
                    onClick={() => onFilterChange?.('reportType', 'Medical Report')}
                  >
                    Medical Report
                  </button>
                  <button 
                    className={`filter-option ${filters?.reportType === 'Lab Test' ? 'active' : ''}`}
                    onClick={() => onFilterChange?.('reportType', 'Lab Test')}
                  >
                    Lab Test
                  </button>
                  <button 
                    className={`filter-option ${filters?.reportType === 'Prescription' ? 'active' : ''}`}
                    onClick={() => onFilterChange?.('reportType', 'Prescription')}
                  >
                    Prescription
                  </button>
                  <button 
                    className={`filter-option ${filters?.reportType === 'Vaccination Record' ? 'active' : ''}`}
                    onClick={() => onFilterChange?.('reportType', 'Vaccination Record')}
                  >
                    Vaccination Record
                  </button>
                  <button 
                    className={`filter-option ${filters?.reportType === 'Doctor\'s Visit Summary' ? 'active' : ''}`}
                    onClick={() => onFilterChange?.('reportType', 'Doctor\'s Visit Summary')}
                  >
                    Doctor's Visit Summary
                  </button>
                </div>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label>Date Range</label>
                <div className="date-inputs">
                  <div className="date-input-wrapper" style={{position: 'relative'}}>
                    <div className="date-input">
                      <input 
                        type="text" 
                        placeholder="Start date (DD/MM/YYYY)" 
                        value={formatDateForDisplay(filters?.startDate)}
                        readOnly
                      />
                      <img 
                        src={calendarIcon} 
                        alt="Calendar" 
                        className="calendar-icon" 
                        style={{cursor: 'pointer', filter: 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)'}}
                        onClick={() => handleCalendarClick('start')}
                      />
                    </div>
                    {showDatePicker.start && (
                      <div className="date-picker-dropdown">
                        <input
                          type="date"
                          min={getUserJoinDate()}
                          max={getTodayDate()}
                          value={filters?.startDate || ''}
                          onChange={(e) => handleDateSelect('start', e.target.value)}
                          onBlur={(e) => {
                            // Keep picker open if user is still interacting with it
                            setTimeout(() => {
                              if (!e.target.matches(':focus')) {
                                setShowDatePicker(prev => ({ ...prev, start: false }));
                              }
                            }, 100);
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <span className="date-separator">to</span>
                  <div className="date-input-wrapper" style={{position: 'relative'}}>
                    <div className="date-input">
                      <input 
                        type="text" 
                        placeholder="End date (DD/MM/YYYY)" 
                        value={formatDateForDisplay(filters?.endDate)}
                        readOnly
                      />
                      <img 
                        src={calendarIcon} 
                        alt="Calendar" 
                        className="calendar-icon" 
                        style={{cursor: 'pointer', filter: 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)'}}
                        onClick={() => handleCalendarClick('end')}
                      />
                    </div>
                    {showDatePicker.end && (
                      <div className="date-picker-dropdown">
                        <input
                          type="date"
                          min={filters?.startDate || getUserJoinDate()}
                          max={getTodayDate()}
                          value={filters?.endDate || ''}
                          onChange={(e) => handleDateSelect('end', e.target.value)}
                          onBlur={(e) => {
                            // Keep picker open if user is still interacting with it
                            setTimeout(() => {
                              if (!e.target.matches(':focus')) {
                                setShowDatePicker(prev => ({ ...prev, end: false }));
                              }
                            }, 100);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="filter-row two-columns">
              <div className="filter-group">
                <label>Hospital / Clinic name</label>
                <input type="text" placeholder="Type to search hospitals or clinics" />
              </div>
            </div>

            <div className="filter-actions">
              <button 
                className="btn-reset"
                onClick={onClearFilters}
              >
                Reset
              </button>
            </div>
            </div>
          )}

          {/* Sort Panel */}
          {showSort && (
            <div className="sort-panel">
              <div className="sort-row">
                <div className="sort-group">
                  <label>Sort By</label>
                  <select
                    value={sortBy || 'report_date'}
                    onChange={(e) => onSort?.(e.target.value)}
                  >
                    <option value="report_date">Report Date</option>
                    <option value="created_at">Upload Date</option>
                    <option value="report_title">Report Title</option>
                    <option value="report_type">Report Type</option>
                    <option value="provider_name">Provider Name</option>
                    <option value="health_report_status">Status</option>
                  </select>
                </div>

                <div className="sort-group">
                  <label>Sort Order</label>
                  <div className="sort-order-buttons">
                    <button
                      className={`sort-order-btn ${sortOrder === 'asc' ? 'active' : ''}`}
                      onClick={() => onSort?.(sortBy, 'asc')}
                    >
                      <img src={ascIcon} alt="Ascending" style={{
                      width: '24px', 
                      height: '18px', 
                      marginRight: '8px',
                      filter: sortOrder === 'asc' ? 'brightness(0) invert(1)' : 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)'
                    }} /> Ascending
                    </button>
                    <button
                      className={`sort-order-btn ${sortOrder === 'desc' ? 'active' : ''}`}
                      onClick={() => onSort?.(sortBy, 'desc')}
                    >
                      <img src={descIcon} alt="Descending" style={{
                      width: '24px', 
                      height: '18px', 
                      marginRight: '8px',
                      filter: sortOrder === 'desc' ? 'brightness(0) invert(1)' : 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)'
                    }}/> Descending
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Table */}
          <div className="results-table">
            <div className="table-header-row">
              <div className="table-header-col">Report Title</div>
              <div className="table-header-col">Report Type</div>
              <div className="table-header-col">Report Date</div>
              <div className="table-header-col">Upload Date</div>
              <div className="table-header-col">Provider name</div>
              <div className="table-header-col">Report Status</div>
              <div className="table-header-col">Actions</div>
            </div>

            <div className="table-body">
              {reports && reports.length > 0 ? (
                reports.map((report) => (
                  <div key={report.id} className="table-data-row">
                    <div className="table-data-col">
                      <div className="report-title">{report.report_title || report.report_type || 'Health Report'}</div>
                      <div className="report-ref">Ref: {report.id.slice(-8).toUpperCase()}</div>
                    </div>
                    <div className="table-data-col">{report.report_type || 'Medical Report'}</div>
                    <div className="table-data-col">
                      {new Date(report.report_date).toLocaleDateString('en-GB')}
                    </div>
                    <div className="table-data-col">
                      {new Date(report.created_at).toLocaleDateString('en-GB')}
                    </div>
                    <div className="table-data-col">
                      {report.provider_name || 'N/A'}
                    </div>
                    <div className="table-data-col">{report.health_report_status || report.due_status || 'Up to Date'}</div>
                    <div className="table-data-col table-actions">
                      <button 
                        className="btn-action"
                        onClick={() => onDownload?.(report.id)}
                      >
                        View
                      </button>
                      <button 
                        className="btn-action"
                        onClick={() => onShareClick?.(report)}
                      >
                        Share
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="table-data-row">
                  <div className="table-data-col" style={{ 
                    gridColumn: '1 / -1', 
                    textAlign: 'center', 
                    padding: '2rem', 
                    color: '#666',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    No health reports found. Upload your first report to get started.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <UploadModal
            uploadForm={uploadForm}
            onCancel={onCancelUploadModal}
            onFormChange={onUploadFormChange}
            onSubmit={onUploadSubmit}
            applicationId={applicationId}
          />
        )}

        {/* Share Modal */}
        {showShareModal && (
          <ShareModal
            show={showShareModal}
            shareForm={shareForm}
            errors={errors}
            onCancel={onCancelShareModal}
            onShareFormChange={onShareFormChange}
            onShareFormSubmit={onShareFormSubmit}
          />
        )}

        {/* Reminder Modal */}
        {showReminderModal && (
          <ReminderModal
            show={showReminderModal}
            reminderForm={reminderForm}
            editingReminder={editingReminder}
            errors={errors}
            onCancel={onCancelReminderModal}
            onFormChange={onReminderFormChange}
            onSubmit={onSubmitReminder}
          />
        )}

        {/* PDF Viewer Modal */}
        {showPDFViewer && viewingReportUrl && (
          <div className="modal-overlay pdf-viewer-overlay" onClick={onClosePDFViewer}>
            <div className="modal-content pdf-viewer-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Health Report</h3>
                <button className="close-button" onClick={onClosePDFViewer}>×</button>
              </div>
              
              <div className="modal-body pdf-viewer-body">
                <iframe
                  src={viewingReportUrl}
                  style={{
                    width: '100%',
                    height: '80vh',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                  title="Health Report PDF"
                />
              </div>
              
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary" 
                  onClick={onClosePDFViewer}
                >
                  Close
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => window.open(viewingReportUrl, '_blank')}
                >
                  Open in New Tab
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HealthMonitoringView({
  // User role
  userRole,
  user, // Add user prop

  // Admin props
  isLoading,
  statistics,
  selectedReport,
  activeTab,
  showApprovalConfirm,
  showArchiveConfirm,
  showFlagModal,
  flagReason,
  actionReport,
  onApproveClick,
  onApproveConfirm,
  onFlagClick,
  onFlagConfirm,
  onArchiveClick,
  onArchiveConfirm,
  onCancelAdminAction,
  onFlagReasonChange,
  onTabChange,

  // Common and user props
  alerts,
  errorMessage,
  reports,
  uploadForm,
  shareForm,
  multiUploadForm,
  searchKey,
  filters,
  sortBy,
  sortOrder,
  showUploadModal,
  showShareModal,
  showPDFViewer,
  viewingReportUrl,
  showFilters,
  showSort,
  isDragging,
  errors,
  successMessage,
  applicationId, // Add applicationId prop

  // Reminder props
  reminders,
  upcomingReminders,
  overdueReminders,
  reminderStats,
  showReminderModal,
  reminderForm,
  editingReminder,

  // User handlers
  onUploadClick,
  onCancelUploadModal,
  onClosePDFViewer,
  onUploadFormChange,
  onMultiUploadFormChange,
  onMultipleFileUpload,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
  onUploadSubmit,
  onCancelShareModal,
  onShareFormChange,
  onShareFormSubmit,
  onSearchChange,
  onSearch,
  onFilter,
  onSetShowFilters,
  onSetShowSort,
  onSort,
  onDownload,
  onShareClick,
  onDelete,

  // Reminder handlers
  onCreateReminder,
  onEditReminder,
  onDeleteReminder,
  onToggleReminder,
  onReminderFormChange,
  onSubmitReminder,
  onCancelReminderModal,

  // Admin handlers
  onFilterChange,
  onClearFilters,
  onTabFilter,
  onReportSelect,
  onViewReport,
  
  // Aliases
  onAdminSort
}) {
  // Render Admin Dashboard if user is admin
  if (userRole === 'admin') {
    return (
      <AdminHealthReportDashboardView
        isLoading={isLoading}
        statistics={statistics}
        reports={reports}
        selectedReport={selectedReport}
        alerts={alerts}
        error={errorMessage}
        successMessage={successMessage}
        searchKey={searchKey}
        filters={filters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        activeTab={activeTab}
        showApprovalConfirm={showApprovalConfirm}
        showArchiveConfirm={showArchiveConfirm}
        showFlagModal={showFlagModal}
        flagReason={flagReason}
        actionReport={actionReport}
        onSearchChange={onSearchChange}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        onTabFilter={onTabFilter}
        onSort={onAdminSort || onSort}
        onReportSelect={onReportSelect}
        onApproveClick={onApproveClick}
        onApproveConfirm={onApproveConfirm}
        onFlagClick={onFlagClick}
        onFlagConfirm={onFlagConfirm}
        onArchiveClick={onArchiveClick}
        onArchiveConfirm={onArchiveConfirm}
        onCancelAdminAction={onCancelAdminAction}
        onFlagReasonChange={onFlagReasonChange}
        onViewReport={onViewReport}
        onTabChange={onTabChange}
      />
    )
  }

  // Render User Health Monitoring View otherwise
  return (
    <UserHealthReportView
      alerts={alerts}
      successMessage={successMessage}
      errorMessage={errorMessage}
      reports={reports}
      uploadForm={uploadForm}
      shareForm={shareForm}
      multiUploadForm={multiUploadForm}
      searchKey={searchKey}
      filters={filters}
      sortBy={sortBy}
      sortOrder={sortOrder}
      showUploadModal={showUploadModal}
      showShareModal={showShareModal}
      showPDFViewer={showPDFViewer}
      viewingReportUrl={viewingReportUrl}
      showFilters={showFilters}
      showSort={showSort}
      isDragging={isDragging}
      errors={errors}
      activeTab={activeTab || 'archived'}
      statistics={statistics}
      user={user}
      applicationId={applicationId}
      reminders={reminders}
      upcomingReminders={upcomingReminders}
      overdueReminders={overdueReminders}
      reminderStats={reminderStats}
      showReminderModal={showReminderModal}
      reminderForm={reminderForm}
      editingReminder={editingReminder}
      onUploadClick={onUploadClick}
      onCancelUploadModal={onCancelUploadModal}
      onClosePDFViewer={onClosePDFViewer}
      onUploadFormChange={onUploadFormChange}
      onMultiUploadFormChange={onMultiUploadFormChange}
      onMultipleFileUpload={onMultipleFileUpload}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onFileSelect={onFileSelect}
      onUploadSubmit={onUploadSubmit}
      onCancelShareModal={onCancelShareModal}
      onShareFormChange={onShareFormChange}
      onShareFormSubmit={onShareFormSubmit}
      onSearchChange={onSearchChange}
      onSearch={onSearch}
      onFilterChange={onFilterChange}
      onClearFilters={onClearFilters}
      onTabFilter={onTabFilter}
      onFilter={onFilter}
      onSetShowFilters={onSetShowFilters}
      onSetShowSort={onSetShowSort}
      onSort={onSort}
      onDownload={onDownload}
      onShareClick={onShareClick}
      onDelete={onDelete}
      onTabChange={onTabChange}
      onViewReport={onViewReport}
      onCreateReminder={onCreateReminder}
      onEditReminder={onEditReminder}
      onDeleteReminder={onDeleteReminder}
      onToggleReminder={onToggleReminder}
      onReminderFormChange={onReminderFormChange}
      onSubmitReminder={onSubmitReminder}
      onCancelReminderModal={onCancelReminderModal}
    />
  )
}
