// src/controllers/CustomerSupportController.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import Inquiry from '../models/Inquiry'
import Application from '../models/Application'
import Nominee from '../models/Nominee'
import CustomerSupportContact from '../models/CustomerSupportContact'
import CustomerSupportView from '../views/CustomerSupportView'
import { supabase } from '../config/supabase'

export default function CustomerSupportController() {
  // 1. 状态管理
  const [activeTab, setActiveTab] = useState('inquiries') // inquiries | applications | nominees
  const [inquiries, setInquiries] = useState([])
  const [applications, setApplications] = useState([])
  const [nominees, setNominees] = useState([])
  const [selectedItem, setSelectedItem] = useState(null) // 当前选中的项目
  const [replies, setReplies] = useState([]) // 回复记录
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('') // 过滤状态

  // 2. 获取数据
  useEffect(() => {
    let mounted = true
    fetchData(mounted)
    return () => { mounted = false }
  }, [activeTab, filterStatus])

  const fetchData = useCallback(async (mounted = true) => {
    setLoading(true)
    try {
      if (activeTab === 'inquiries') {
        const { data, success } = await Inquiry.getAll({ status: filterStatus })
        if (success && mounted) setInquiries(data || [])
      } else if (activeTab === 'applications') {
        const { data, success } = await Application.getAll()
        if (success && mounted) setApplications(data || [])
      } else if (activeTab === 'nominees') {
        const { data, success } = await Nominee.getAll({ status: filterStatus })
        if (success && mounted) setNominees(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      if (mounted) setLoading(false)
    }
  }, [activeTab, filterStatus])

  // 3. 切换标签
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSelectedItem(null) // 清空选中项
    setReplies([])
    setSearchTerm('')
    setFilterStatus('')
  }

  // 4. 选择项目（显示详情）
  const handleSelectItem = async (item) => {
    setSelectedItem(item)
    
    // 如果是 Inquiry，加载回复记录
    if (activeTab === 'inquiries' && item.id) {
      const { data, success } = await CustomerSupportContact.getByInquiryId(item.id)
      if (success) setReplies(data || [])
    }
  }

  // 5. 发送回复
  const getCurrentUserId = async () => {
    try {
      if (supabase?.auth?.getUser) {
        const { data } = await supabase.auth.getUser()
        if (data?.user?.id) return data.user.id
      } else if (supabase?.auth?.user) {
        const user = supabase.auth.user()
        if (user?.id) return user.id
      }
    } catch (e) {
      // ignore and fallback
    }
    return 'current-support-user-id'
  }

  const handleSendReply = async (message, contactType = 'reply') => {
    if (!selectedItem || !message.trim()) return { success: false }

    try {
      const currentUserId = await getCurrentUserId()

      const { success, data } = await CustomerSupportContact.sendReply(
        selectedItem.id,
        currentUserId,
        message,
        contactType
      )

      if (success) {
        // 更新回复列表
        setReplies(prev => [...prev, data])
        
        // 更新询问状态
        setInquiries(prev => prev.map(inq => 
          inq.id === selectedItem.id 
            ? { ...inq, status: 'in_progress' }
            : inq
        ))
        
        // 更新当前选中项
        setSelectedItem(prev => prev ? { ...prev, status: 'in_progress' } : prev)

        return { success: true }
      }
    } catch (error) {
      console.error('Failed to send reply:', error)
      return { success: false, error }
    }
  }

  // 6. 搜索功能
  const searchTimerRef = useRef(null)
  const handleSearch = (term) => {
    setSearchTerm(term)

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)

    // debounce 350ms
    searchTimerRef.current = setTimeout(async () => {
      if (!term.trim()) {
        fetchData()
        return
      }

      setLoading(true)
      try {
        if (activeTab === 'inquiries') {
          const { data, success } = await Inquiry.search(term)
          if (success) setInquiries(data || [])
        } else if (activeTab === 'nominees') {
          const { data, success } = await Nominee.search(term)
          if (success) setNominees(data || [])
        }
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setLoading(false)
      }
    }, 350)
  }

  // 7. 过滤状态
  const handleFilterChange = (status) => {
    setFilterStatus(status)
  }

  // 8. 更新状态（审核/解决）
  const handleUpdateStatus = async (id, status) => {
    try {
      if (activeTab === 'inquiries') {
        const { success } = await Inquiry.updateStatus(id, status)
        if (success) {
          fetchData() // 刷新列表
          if (selectedItem?.id === id) {
            setSelectedItem({ ...selectedItem, status })
          }
        }
      } else if (activeTab === 'nominees') {
        const { success } = await Nominee.updateStatus(id, status)
        if (success) fetchData()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  // 9. 获取当前列表数据
  const getCurrentData = () => {
    switch (activeTab) {
      case 'inquiries':
        return inquiries
      case 'applications':
        return applications
      case 'nominees':
        return nominees
      default:
        return []
    }
  }

  // 10. 渲染 View
  return (
    <CustomerSupportView
      activeTab={activeTab}
      onTabChange={handleTabChange}
      data={getCurrentData()}
      selectedItem={selectedItem}
      onSelectItem={handleSelectItem}
      replies={replies}
      onSendReply={handleSendReply}
      onUpdateStatus={handleUpdateStatus}
      loading={loading}
      searchTerm={searchTerm}
      onSearch={handleSearch}
      filterStatus={filterStatus}
      onFilterChange={handleFilterChange}
    />
  )
}