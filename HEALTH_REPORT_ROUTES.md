// Additional routes to be added to App.jsx

// Add these routes to the existing Routes component:

{/* Application-specific health report routes */}
<Route path="/application/:applicationId/health-reports" element={
  <ProtectedRoute>
    <>
      <Header />
      <HealthReportController />
      <Footer />
    </>
  </ProtectedRoute>
} />

<Route path="/maintainApplication/:applicationId/health-reports" element={
  <ProtectedRoute>
    <>
      <Header />
      <HealthReportController />
      <Footer />
    </>
  </ProtectedRoute>
} />

// These routes should be added to App.jsx before the closing </Routes> tag
// They enable health reports to be linked to specific applications via URL parameters