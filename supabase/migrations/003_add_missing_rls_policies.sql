-- Add missing INSERT and UPDATE policies for nominees and properties tables

-- Nominees: Allow users to create and update nominees for their applications
CREATE POLICY "Users can create nominees for own applications" ON nominees
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = nominees.application_id 
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update nominees for own applications" ON nominees
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = nominees.application_id 
      AND (applications.user_id = auth.uid() OR applications.joint_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete nominees for own applications" ON nominees
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = nominees.application_id 
      AND applications.user_id = auth.uid()
    )
  );

-- Properties: Allow users to create and update properties for their applications
CREATE POLICY "Users can create properties for own applications" ON properties
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = properties.application_id 
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update properties for own applications" ON properties
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = properties.application_id 
      AND (applications.user_id = auth.uid() OR applications.joint_user_id = auth.uid())
    )
  );

-- Transactions: Add missing INSERT policy
CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Health Reports: Add missing INSERT and UPDATE policies
CREATE POLICY "Users can create own health reports" ON health_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health reports" ON health_reports
  FOR UPDATE USING (auth.uid() = user_id);
