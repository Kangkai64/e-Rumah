-- Add INSERT and UPDATE policies for properties and nominees tables only

-- Properties: Allow users to create properties for their applications
CREATE POLICY "Users can create properties for own applications" ON properties
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = properties.application_id 
      AND applications.user_id = auth.uid()
    )
  );

-- Properties: Allow users to update properties for their applications
CREATE POLICY "Users can update properties for own applications" ON properties
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = properties.application_id 
      AND (applications.user_id = auth.uid() OR applications.joint_user_id = auth.uid())
    )
  );

-- Nominees: Allow users to create nominees for their applications
CREATE POLICY "Users can create nominees for own applications" ON nominees
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = nominees.application_id 
      AND applications.user_id = auth.uid()
    )
  );

-- Nominees: Allow users to update nominees for their applications
CREATE POLICY "Users can update nominees for own applications" ON nominees
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = nominees.application_id 
      AND (applications.user_id = auth.uid() OR applications.joint_user_id = auth.uid())
    )
  );

-- Nominees: Allow users to delete nominees (needed for replacing nominees)
CREATE POLICY "Users can delete nominees for own applications" ON nominees
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM applications 
      WHERE applications.id = nominees.application_id 
      AND applications.user_id = auth.uid()
    )
  );
