"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

function MenuBars() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const menuRefs = useRef<Array<HTMLLIElement | null>>([]);

  const menus = [
    { name: "Dashboard", href: "/dashboard", icon: "ri-home-9-line" },
    {
      name: "Quotes",
      icon: "ri-file-list-2-line",
      children: [
        { name: "Quick Quote", href: "/quote/quick-quote" },
        { name: "Saved Quote", href: "/quote/save-quote" },
      ],
    },
    {
      name: "Jobs",
      icon: "ri-box-3-line",
      children: [
        { name: "All Jobs", href: "/jobs" },
        { name: "Booking Jobs", href: "/jobs/booking" },
      ],
    },
    { name: "Invoices", href: "/invoices", icon: "ri-price-tag-3-line" },
    {
      name: "Profile",
      icon: "ri-account-circle-line",
      children: [{ name: "Profile", href: "/profile" }],
    },
  ];

  useEffect(() => {
    menus.forEach((menu, index) => {
      const isActive =
        menu.href &&
        (menu.href === "/" ? pathname === "/" : pathname.startsWith(menu.href));
      const isChildActive = menu.children?.some((c) =>
        pathname.startsWith(c.href),
      );
      if (isActive || isChildActive) {
        const el = menuRefs.current[index];
        if (el) {
          setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
        }
      }
    });
  }, [pathname]);

  // Fungsi toggle khusus mobile
  const handleToggle = (name: string) => {
    setOpen(open === name ? null : name);
  };

  return (
    <div className="bg-blue-600 text-white border-b border-blue-400 sticky top-16 md:top-20 z-[100] shadow-sm">
      <div className="max-w-[1600px] mx-auto overflow-x-auto md:overflow-visible no-scrollbar">
        <ul className="flex items-start md:items-center min-w-max md:min-w-0 px-4 md:px-10 relative">
          {/* SLIDING INDICATOR (Desktop Only) */}
          {indicatorStyle.width > 0 && (
            <span
              className="absolute bottom-0 h-[3px] bg-yellow-300 transition-all duration-300 ease-in-out rounded-full hidden md:block"
              style={indicatorStyle}
            />
          )}

          {menus.map((menu, index) => {
            const isChildActive = menu.children?.some((c) =>
              pathname.startsWith(c.href),
            );
            const isActive =
              menu.href &&
              (menu.href === "/"
                ? pathname === "/"
                : pathname.startsWith(menu.href));
            const isOpen = open === menu.name;

            return (
              <li
                key={menu.name}
                ref={(el) => {
                  menuRefs.current[index] = el;
                }}
                className="relative"
                onMouseEnter={() =>
                  window.innerWidth > 768 && menu.children && setOpen(menu.name)
                }
                onMouseLeave={() => window.innerWidth > 768 && setOpen(null)}
              >
                {menu.children ? (
                  <div className="flex flex-col md:block">
                    {/* Parent Menu Item */}
                    <div
                      onClick={() => handleToggle(menu.name)}
                      className={`flex gap-2 px-4 md:px-6 py-3 md:py-4 items-center font-semibold cursor-pointer whitespace-nowrap text-xs md:text-sm transition-colors ${
                        isChildActive || isOpen
                          ? "text-yellow-300"
                          : "hover:text-yellow-100"
                      }`}
                    >
                      <i className={`${menu.icon} text-base`}></i>
                      {menu.name}
                      <i
                        className={`ri-arrow-down-s-line transition-transform ${isOpen ? "rotate-180" : ""}`}
                      ></i>
                    </div>

                    {/* DROPDOWN LOGIC */}
                    {isOpen && (
                      <div
                        className="
                        md:absolute md:top-full md:left-0 md:pt-2 md:w-52 md:z-[130] 
                        relative w-full bg-blue-700 md:bg-transparent
                      "
                      >
                        <div className="bg-white text-gray-800 md:rounded-xl shadow-2xl border-t md:border border-gray-100 overflow-hidden flex flex-col">
                          {menu.children.map((child) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              onClick={() => setOpen(null)}
                              className={`block px-5 py-3 text-[11px] md:text-xs transition-all border-l-4 ${
                                pathname === child.href
                                  ? "bg-blue-50 border-blue-600 text-blue-600 font-bold"
                                  : "bg-white border-transparent hover:bg-gray-50 hover:text-blue-600"
                              }`}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={menu.href!}
                    className={`flex gap-2 px-4 md:px-6 py-3 md:py-4 items-center font-semibold whitespace-nowrap text-xs md:text-sm transition-colors ${isActive ? "text-yellow-300" : "hover:text-yellow-100"}`}
                  >
                    <i className={`${menu.icon} text-base`}></i>
                    {menu.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default MenuBars;
