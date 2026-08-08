import re

with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

# Replace the block with a wrapping div
start_marker = '{/* MENU DRAWER TOGGLE BUTTON FOR ALL NAVIGATION (ADMIN, BIZ CENTER, ETC) */}'
end_marker = '          </div>\n        </div>' # End of LOGO SECTION

idx_start = content.find(start_marker)
idx_end = content.find(end_marker, idx_start) + len(end_marker)

if idx_start != -1 and idx_end != -1:
    original_block = content[idx_start:idx_end]
    
    # Wrap in a flex container
    wrapped_block = f'''        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {original_block}
        </div>'''
        
    content = content[:idx_start] + wrapped_block + content[idx_end:]
    
    with open('src/components/Navbar.tsx', 'w') as f:
        f.write(content)
    print("Wrapped menu and logo in a flex container.")
else:
    print("Could not find the block to wrap.")
