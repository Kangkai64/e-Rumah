import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import Header from '../layouts/Header';
import Footer from '../layouts/Footer';
import '../views/CustomerSupport.css';

const CustomerSupportUpdateView = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    contactEmail: '',
    contactPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 加载现有的联系信息
  useEffect(() => {
    fetchContactSettings();
  }, []);

  const fetchContactSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_support_contact')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          contactEmail: data.contact_email || '',
          contactPhone: data.contact_phone || ''
        });
      }
    } catch (err) {
      console.error('Error fetching contact settings:', err);
      // 如果没有数据，使用默认值
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除错误信息
    if (error) setError('');
  };

  const validateForm = () => {
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contactEmail)) {
      setError('Please enter a valid email address');
      return false;
    }

    // 验证电话号码格式（马来西亚格式 - 更宽松）
    // 允许: 03-1234 5678, 03-12345678, 0312345678, 011-1234567, 等
    const phoneRegex = /^0\d{1,3}[\s\-]?\d{3,4}[\s\-]?\d{4}$/;
    if (!phoneRegex.test(formData.contactPhone.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number (e.g., 03-1112 9429 or 011-1234567)');
      return false;
    }

    return true;
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 检查是否已存在记录
      const { data: existingData, error: fetchError } = await supabase
        .from('customer_support_contact')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingData) {
        // 更新现有记录
        const { error: updateError } = await supabase
          .from('customer_support_contact')
          .update({
            contact_email: formData.contactEmail,
            contact_phone: formData.contactPhone,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);

        if (updateError) throw updateError;
      } else {
        // 创建新记录
        const { error: insertError } = await supabase
          .from('customer_support_contact')
          .insert([{
            contact_email: formData.contactEmail,
            contact_phone: formData.contactPhone
          }]);

        if (insertError) throw insertError;
      }

      setSuccess('Contact settings updated successfully!');
      
      // 3秒后跳转
      setTimeout(() => {
        navigate('/customer-support');
      }, 2000);

    } catch (err) {
      console.error('Error updating contact settings:', err);
      setError('Failed to update contact settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/support/dashboard');
  };

  return (
    <>
      <Header />
      <div className="customer-support-container">
        <div className="settings-card">
          <h1 className="settings-title">Website Contact Settings</h1>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}

          <form onSubmit={handleConfirm}>
            <div className="form-group">
              <label htmlFor="contactEmail" className="form-label">
                Contact Email Address
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                className="form-input"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder="support@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactPhone" className="form-label">
                Contact Phone Number
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                className="form-input"
                value={formData.contactPhone}
                onChange={handleInputChange}
                placeholder="03-1112 9429"
                required
              />
            </div>

            <div className="button-group">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CustomerSupportUpdateView;