import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import VerifiedBadge from "../components/shared/VerifiedBadge";

const About = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      // Initialize the map
      const map = L.map(mapRef.current, {
        center: [27.5119, 83.4665], // Bhairahawa Siddharthanagar coordinates
        zoom: 13,
        zoomControl: true,
        attributionControl: true,
      });

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      // Add a marker for Bhairahawa Siddharthanagar
      const marker = L.marker([27.5119, 83.4665])
        .addTo(map)
        .bindPopup(
          "CargoNepal Headquarters<br>Bhairahawa Siddharthanagar, Nepal",
        )
        .openPopup();

      // Store map instance
      mapInstanceRef.current = map;

      // Handle window resize
      const handleResize = () => {
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      };

      window.addEventListener("resize", handleResize);

      // Cleanup function
      return () => {
        window.removeEventListener("resize", handleResize);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            About CargoNepal
          </h1>
          <p className="text-xl sm:text-2xl text-slate-200 max-w-3xl mx-auto">
            Connecting Nepal through trusted cargo transportation
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Our Story */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Our Story
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-4">
                CargoNepal was founded by <strong>Govinda Gupta</strong> and{" "}
                <strong>Sanjay Gupta</strong>, a father-son duo with a vision to
                transform the logistics industry in Nepal. What started as a
                dream to connect businesses and individuals across the country
                has grown into a trusted platform that serves thousands of
                customers daily.
              </p>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-4">
                Under the leadership of <strong>Sanjay Gupta</strong> as CEO,
                CargoNepal continues to innovate and expand its services,
                ensuring fast, secure, and transparent logistics solutions for
                everyone in Nepal.
              </p>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                Today, we are proud to be one of Nepal's leading cargo booking
                platforms, connecting customers with reliable vehicle owners
                across the nation.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center mb-4">
              <div className="bg-slate-100 rounded-lg p-3 mr-4">
                <svg
                  className="w-8 h-8 text-slate-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Our Mission</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              To revolutionize cargo transportation in Nepal by providing a
              transparent, reliable, and efficient platform that connects
              customers with verified vehicle owners, ensuring seamless
              logistics solutions for businesses and individuals nationwide.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex items-center mb-4">
              <div className="bg-slate-100 rounded-lg p-3 mr-4">
                <svg
                  className="w-8 h-8 text-slate-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Our Vision</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              To become Nepal's most trusted and innovative logistics platform,
              bridging distances and enabling economic growth by making cargo
              transportation accessible, affordable, and reliable for everyone,
              from small businesses to large enterprises.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our Core Values
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Trust & Transparency",
                description:
                  "We believe in honest communication and transparent processes, building trust with every transaction.",
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                ),
              },
              {
                title: "Reliability",
                description:
                  "We ensure timely delivery and consistent service quality, so you can count on us every time.",
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
              },
              {
                title: "Customer First",
                description:
                  "Your satisfaction is our priority. We listen, adapt, and continuously improve to serve you better.",
                icon: (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                ),
              },
            ].map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center"
              >
                <div className="bg-slate-100 rounded-lg p-4 inline-flex mb-4">
                  <div className="text-slate-900">{value.icon}</div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Leadership */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center">
              Leadership
            </h2>
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <div className="bg-slate-100 rounded-full w-32 h-32 mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">
                  <img
                    src="/sanjay-gupta.jpg"
                    alt="Sanjay Gupta - CEO"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentElement.innerHTML = `
                        <svg class="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      `;
                    }}
                  />
                </div>
                <div className="flex items-center justify-center mb-2">
                  <h3 className="text-2xl font-bold text-gray-900">Sanjay Gupta</h3>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center transform transition-all duration-300 hover:scale-110 ml-0">
                    <VerifiedBadge size={24} />
                  </div>
                </div>
                <p className="text-lg text-slate-600 mb-4">
                  Chief Executive Officer (CEO)
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Leading CargoNepal with dedication and innovation, Sanjay
                  Gupta continues the legacy started with his father, driving
                  the company towards excellence in Nepal's logistics sector.
                </p>
                <div className="flex justify-center space-x-4">
                  <a
                    href="https://www.linkedin.com/in/sanjay-gupta-400849322/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-gray-500 bg-white shadow-sm hover:shadow-lg hover:scale-110 transition-all duration-300 ease-out hover:duration-500"
                    aria-label="LinkedIn"
                  >
                    <svg
                      className="w-5 h-5 fill-current transition-all duration-300 ease-out group-hover:duration-500 group-hover:text-blue-700"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.facebook.com/sanjay.gupta.603772/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-gray-500 bg-white shadow-sm hover:shadow-lg hover:scale-110 transition-all duration-300 ease-out hover:duration-500"
                    aria-label="Facebook"
                  >
                    <svg
                      className="w-5 h-5 fill-current transition-all duration-300 ease-out group-hover:duration-500 group-hover:text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Our Location
            </h2>

            <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
              <div className="flex-1">
                <div className="flex items-center mb-6">
                  <div className="bg-slate-100 rounded-lg p-3 mr-4">
                    <svg
                      className="w-8 h-8 text-slate-900"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Bhairahawa Siddharthanagar
                  </h3>
                </div>

                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-4">
                    Serving customers across Nepal with our headquarters based
                    in <strong>Bhairahawa Siddharthanagar</strong>,
                    strategically located to serve both eastern and western
                    regions of the country.
                  </p>
                  <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-4">
                    Located near the Indian border, providing easy access to
                    cross-border trade and transportation routes, making it an
                    ideal hub for logistics operations throughout Nepal.
                  </p>
                  <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                    <strong>Address:</strong> Bhairahawa Siddharthanagar,
                    Rupandehi District, Nepal
                  </p>
                </div>
              </div>

              <div className="flex-1 lg:max-w-lg w-full">
                <div className="bg-gray-100 rounded-lg overflow-hidden shadow-inner relative z-10">
                  <div
                    ref={mapRef}
                    className="w-full h-64 sm:h-72 md:h-80 lg:h-96"
                    style={{
                      minHeight: "256px",
                      height: "100%",
                      zIndex: 1,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-lg shadow-lg p-8 sm:p-10 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-slate-200 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust CargoNepal for their
            transportation needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-slate-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Sign Up Now
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-slate-900 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
