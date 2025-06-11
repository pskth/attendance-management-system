import Link from "next/link";

export default function Home() {
  const userRoles = [
    {
      role: "student",
      title: "Student Portal",
      icon: "🎓",
      description: "Access your courses, grades, and academic resources",
      color: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
      shadow: "shadow-blue-500/20",
    },
    {
      role: "teacher",
      title: "Faculty Portal",
      icon: "👨‍🏫",
      description: "Manage classes, assignments, and student progress",
      color:
        "from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
      shadow: "shadow-emerald-500/20",
    },
    {
      role: "admin",
      title: "Admin Portal",
      icon: "⚙️",
      description: "System administration and institutional management",
      color: "from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
      shadow: "shadow-red-500/20",
    },
    {
      role: "report_viewers",
      title: "Analytics Portal",
      icon: "📊",
      description: "View reports, analytics, and institutional insights",
      color:
        "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
      shadow: "shadow-orange-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6 shadow-lg">
            <span className="text-2xl text-white font-bold">ERP</span>
          </div>
          <h1 className="text-5xl font-bold text-slate-800 mb-4 tracking-tight">
            College ERP System
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A comprehensive educational resource platform designed to streamline
            academic operations and enhance institutional efficiency
          </p>
        </div>

        {/* Login Portals Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {userRoles.map((portal) => (
              <Link key={portal.role} href={`/login/${portal.role}`} className="group block h-full">
                <div
                  className={`
                  relative h-48 p-6 rounded-2xl bg-gradient-to-r ${portal.color} 
                  text-white transition-all duration-300 ease-in-out
                  transform group-hover:scale-105 group-hover:shadow-2xl ${portal.shadow}
                  border border-white/20 backdrop-blur-sm
                  flex flex-col justify-between
                `}
                >
                  {/* Icon */}
                  <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    {portal.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between">
                    {/* Title */}
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-white/90 leading-tight">
                      {portal.title}
                    </h3>

                    {/* Description */}
                    <p className="text-white/80 text-xs leading-relaxed group-hover:text-white/70 line-clamp-3">
                      {portal.description}
                    </p>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer Section */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 text-slate-500 text-sm">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>Secure institutional access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
