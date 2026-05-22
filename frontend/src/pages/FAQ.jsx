import { useState } from 'react';
import { Link } from 'react-router-dom';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      category: 'General',
      questions: [
        {
          q: 'What is CargoNepal?',
          a: 'CargoNepal is a platform that connects customers who need cargo transportation services with reliable truck owners across Nepal. We facilitate easy booking, transparent pricing, and secure transactions.'
        },
        {
          q: 'How does CargoNepal work?',
          a: 'Customers browse available trucks, select one that fits their needs, and submit a booking request. Truck owners review and accept bookings. Once confirmed, both parties can communicate and coordinate the transportation details.'
        },
        {
          q: 'Is CargoNepal available throughout Nepal?',
          a: 'Yes, CargoNepal operates across Nepal, connecting customers and truck owners from all regions of the country.'
        },
        {
          q: 'Is there a mobile app?',
          a: 'Currently, CargoNepal is available as a web platform accessible on all devices. We are working on mobile applications for enhanced user experience.'
        }
      ]
    },
    {
      category: 'Account & Registration',
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click "Sign Up" in the navigation bar, choose your role (Customer or Owner), fill in your details, verify your email with the OTP sent to your inbox, and you\'re ready to go!'
        },
        {
          q: 'Do I need to verify my email?',
          a: 'Yes, email verification is mandatory for account security. You\'ll receive a 6-digit OTP code via email that you need to enter to activate your account.'
        },
        {
          q: 'Can I change my account type after registration?',
          a: 'Account types (Customer/Owner) are set during registration. If you need to switch roles, please contact our support team or create a separate account for the other role.'
        },
        {
          q: 'What should I do if I forgot my password?',
          a: 'Click "Forgot password?" on the login page, enter your email, verify the OTP sent to your email, and set a new password. Make sure to use a strong password.'
        }
      ]
    },
    {
      category: 'Booking',
      questions: [
        {
          q: 'How do I book a truck?',
          a: 'Browse available trucks, click on a truck to see details, click "Book Now", fill in your booking information (pickup location, delivery location, date, cargo details), review the estimated cost, and submit your booking request.'
        },
        {
          q: 'How is the price calculated?',
          a: 'Pricing is calculated based on the distance between pickup and delivery locations and the rate per kilometer set by the truck owner. The system automatically calculates the total cost for you.'
        },
        {
          q: 'Can I cancel a booking?',
          a: 'Yes, you can cancel bookings from your dashboard. Cancellation policies may vary, so please review the booking details and communicate with the truck owner if needed.'
        },
        {
          q: 'What information do I need to provide when booking?',
          a: 'You\'ll need to provide: pickup address, delivery address, preferred date and time, cargo description, cargo weight/dimensions, and any special requirements or instructions.'
        },
        {
          q: 'How long does it take for a booking to be confirmed?',
          a: 'Truck owners typically respond to booking requests within 24 hours. You\'ll receive notifications when your booking status changes.'
        }
      ]
    },
    {
      category: 'Payment',
      questions: [
        {
          q: 'What payment methods are accepted?',
          a: 'Payment methods vary depending on the truck owner. Common methods include cash on delivery, bank transfer, and digital wallets. Payment terms are typically discussed between you and the owner.'
        },
        {
          q: 'When do I need to pay?',
          a: 'Payment terms are agreed upon between you and the truck owner. Some require advance payment, while others accept payment upon delivery. Check the booking confirmation for specific payment instructions.'
        },
        {
          q: 'Are there any hidden fees?',
          a: 'All fees are transparently displayed during the booking process. The total cost includes the transportation fee based on distance and rate. Any platform fees, if applicable, will be clearly shown.'
        },
        {
          q: 'What if there\'s a payment dispute?',
          a: 'Payment disputes should be resolved directly with the truck owner. If you need assistance, contact our support team, and we\'ll help facilitate communication between parties.'
        }
      ]
    },
    {
      category: 'For Truck Owners',
      questions: [
        {
          q: 'How do I register my truck?',
          a: 'Sign up as an Owner, go to your dashboard, click "Add Truck", fill in your truck details (type, capacity, dimensions, rate per km, photos), and submit. Your truck will be available for bookings once approved.'
        },
        {
          q: 'What documents do I need?',
          a: 'You should have valid vehicle registration, insurance, driver\'s license, and any required permits. While we don\'t collect these documents online, customers may request to see them before booking.'
        },
        {
          q: 'How do I set my rates?',
          a: 'Set your rate per kilometer when adding or editing your truck. This rate is used to calculate the total booking cost. Make sure your rates are competitive and fair based on market standards.'
        },
        {
          q: 'How do I manage booking requests?',
          a: 'You\'ll receive booking requests in your Owner Dashboard. Review each request, check availability, and accept or reject based on your schedule. You can communicate with customers through the platform.'
        },
        {
          q: 'What happens if I need to cancel an accepted booking?',
          a: 'Canceling accepted bookings can impact your reputation. Contact the customer immediately if you must cancel, explain the situation, and try to find alternative solutions. Frequent cancellations may affect your account status.'
        }
      ]
    },
    {
      category: 'Safety & Insurance',
      questions: [
        {
          q: 'Is my cargo insured?',
          a: 'CargoNepal facilitates connections between customers and truck owners but does not provide insurance. Customers are encouraged to obtain appropriate insurance coverage for their cargo. Truck owners should have valid vehicle insurance.'
        },
        {
          q: 'What if my cargo is damaged during transportation?',
          a: 'Any damage claims should be addressed directly with the truck owner. We recommend taking photos of cargo before loading and after unloading, and having clear agreements about liability. Consider obtaining cargo insurance.'
        },
        {
          q: 'How can I verify a truck owner\'s credentials?',
          a: 'Truck owners on our platform are verified users. You can review their profile, ratings, and booking history. However, we recommend verifying licenses, insurance, and permits before finalizing bookings.'
        }
      ]
    },
    {
      category: 'Support & Help',
      questions: [
        {
          q: 'How can I contact customer support?',
          a: 'You can contact us via email at cargonepal21@gmail.com, phone at +977 9766382090 (WhatsApp), or use the contact form on our website. Our support team is available 24/7.'
        },
        {
          q: 'I didn\'t receive my OTP. What should I do?',
          a: 'Check your spam/junk folder first. If you still don\'t receive it, wait 30 seconds and request a new OTP. Ensure your email address is correct. If problems persist, contact support.'
        },
        {
          q: 'How do I report a problem or complaint?',
          a: 'Use our contact form or email cargonepal21@gmail.com with details about the issue. Include booking information, screenshots if applicable, and we\'ll investigate and respond promptly.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl sm:text-2xl text-slate-200 max-w-3xl mx-auto">
            Find answers to common questions about CargoNepal
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Search Bar (optional - can be implemented later) */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search FAQs..."
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              onKeyUp={(e) => {
                // Basic search functionality - can be enhanced
                const searchTerm = e.target.value.toLowerCase();
                // This is a simple implementation - can be improved with state management
              }}
            />
            <svg
              className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">{category.category}</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {category.questions.map((faq, faqIndex) => {
                  const globalIndex = categoryIndex * 100 + faqIndex;
                  const isOpen = openIndex === globalIndex;
                  
                  return (
                    <div key={faqIndex} className="transition-colors hover:bg-gray-50">
                      <button
                        onClick={() => toggleFAQ(globalIndex)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                      >
                        <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                        <svg
                          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 pb-4">
                          <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-12 bg-gradient-to-r from-slate-900 to-slate-700 rounded-lg shadow-lg p-8 sm:p-10 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-xl text-slate-200 mb-8 max-w-2xl mx-auto">
            Can't find the answer you're looking for? Our support team is here to help you 24/7
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-block px-8 py-3 bg-white text-slate-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              to="/help"
              className="inline-block px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-slate-900 transition-colors"
            >
              Visit Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;

