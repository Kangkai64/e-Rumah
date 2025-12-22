// FAQs Component - Accordion-based FAQ page
// Displays frequently asked questions with collapsible answers

import { useState } from 'react'
import './FAQs.css'

function FAQs() {
  const [expandedId, setExpandedId] = useState(null)

  const faqs = [
    {
      id: 1,
      question: 'What transaction expenses do I have to pay for?',
      answer: 'The transaction expenses typically include legal fees, valuation costs, and administrative charges. These will be clearly outlined in your application package.'
    },
    {
      id: 2,
      question: 'What are my obligations once I\'ve signed up for the Reverse Mortgage Scheme?',
      answer: 'Your main obligations include maintaining the property in good condition, paying property taxes and insurance, and ensuring the home remains your primary residence.'
    },
    {
      id: 3,
      question: 'What happens when I pass away and my spouse is still around?',
      answer: 'The scheme provides protection for your surviving spouse. They can continue to receive the monthly payout or may have the option to adjust the scheme terms.'
    },
    {
      id: 4,
      question: 'Can I bequest my home to my children?',
      answer: 'Yes, your heirs have the option to repay the outstanding loan amount to retain ownership of the property after your passing.'
    },
    {
      id: 5,
      question: 'Can I buy back my home in the future?',
      answer: 'Yes, you can repay the loan at any time and reclaim full ownership of your home. Please contact us for details on the repayment process.'
    },
    {
      id: 6,
      question: 'What happens if a divorce happens in the future?',
      answer: 'In the event of divorce, the scheme terms may be adjusted. It is recommended to seek legal advice to understand how this affects your arrangement.'
    },
    {
      id: 7,
      question: 'What happens if my spouse passes on, and I remarry?',
      answer: 'The scheme continues for you as the original participant. Any new marital arrangements do not automatically change the terms of your reverse mortgage.'
    },
    {
      id: 8,
      question: 'Can I rent out my home or leave it vacant as I have another home elsewhere?',
      answer: 'No, your home must remain your primary residence as per the scheme requirements. It cannot be rented out or left vacant for extended periods.'
    },
    {
      id: 9,
      question: 'What if I need to move out for residential care needs?',
      answer: 'If you need to move for care purposes, you should notify us immediately. We can discuss options to temporarily suspend or adjust the scheme.'
    },
    {
      id: 10,
      question: 'What if I migrate overseas?',
      answer: 'Migration overseas may affect your eligibility. Please contact us to understand the implications and any necessary steps you need to take.'
    },
    {
      id: 11,
      question: 'Can I renovate the home in the future?',
      answer: 'Yes, you can make renovations. However, major structural changes should be approved in advance. Contact us for guidance on renovation policies.'
    }
  ]

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="faqs-wrapper">
      {/* Hero Section */}
      <div className="faqs-hero">
          <img src="/src/assets/images/FAQs/Section.png" alt="FAQs" className="hero-image" />
        </div>

        {/* FAQ Section */}
        <div className="faqs-section">
          <div className="faqs-container">
            <div className="faqs-header">
              <h5 className="faqs-label">HAVE QUESTIONS?</h5>
              <h2 className="faqs-title">Find Answers to Your Most Common Queries</h2>
            </div>

            <div className="faqs-list">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`faq-item ${expandedId === faq.id ? 'expanded' : ''}`}
                >
                  <button
                    className="faq-button"
                    onClick={() => toggleExpand(faq.id)}
                    aria-expanded={expandedId === faq.id}
                  >
                    <h4 className="faq-question">{faq.question}</h4>
                    <span className="faq-toggle">
                      {expandedId === faq.id ? '−' : '+'}
                    </span>
                  </button>

                  {expandedId === faq.id && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  )
}

export default FAQs
