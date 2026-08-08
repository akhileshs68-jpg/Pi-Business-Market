import re

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

# Find the menu button
menu_button_start = content.find('{/* MENU DRAWER TOGGLE BUTTON FOR ALL NAVIGATION (ADMIN, BIZ CENTER, ETC) */}')
if menu_button_start == -1:
    print("Could not find menu button")
    exit(1)
    
menu_button_end = content.find('</button>', menu_button_start) + len('</button>')
menu_button = content[menu_button_start:menu_button_end]

# Remove the menu button from the original location
content = content[:menu_button_start] + content[menu_button_end:]

# Insert it before the LOGO SECTION
logo_section_start = content.find('{/* LOGO SECTION */}')
if logo_section_start == -1:
    print("Could not find logo section")
    exit(1)

# We want to put it in a flex container with the logo maybe?
# The wrapper is: <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2.5 sm:gap-4">
# So inserting before LOGO SECTION inside this wrapper will make it the first item.
content = content[:logo_section_start] + menu_button + '\n        ' + content[logo_section_start:]

with open('src/components/Navbar.tsx', 'w') as f:
    f.write(content)

print("Navbar updated")
