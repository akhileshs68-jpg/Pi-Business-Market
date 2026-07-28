const fs = require('fs');
let code = fs.readFileSync('src/components/business/BusinessWizard.tsx', 'utf8');

const newTypes = `const BUSINESS_TYPES = [
  { id: 'Product Seller', label: 'Product Seller', icon: ShoppingCart, desc: 'Sell physical or digital goods.' },
  { id: 'Service Provider', label: 'Service Provider', icon: Wrench, desc: 'Offer professional, home, or technical services.' },
  { id: 'Carpenter', label: 'Carpenter', icon: Wrench, desc: 'Woodworking and furniture.' },
  { id: 'Potter', label: 'Potter', icon: Palette, desc: 'Ceramics and clay crafting.' },
  { id: 'Farmer', label: 'Farmer', icon: Tractor, desc: 'Agriculture, organic produce, dairy.' },
  { id: 'Tailor', label: 'Tailor', icon: ShoppingCart, desc: 'Clothing alterations and custom apparel.' },
  { id: 'Manufacturer', label: 'Manufacturer', icon: Factory, desc: 'Produce goods, operate factories.' },
  { id: 'Doctor', label: 'Doctor', icon: HeartPulse, desc: 'Medical professional, clinic.' },
  { id: 'Lawyer', label: 'Lawyer', icon: Briefcase, desc: 'Legal consulting and services.' },
  { id: 'Freelancer', label: 'Freelancer', icon: User, desc: 'Independent professional offering specialized skills.' },
  { id: 'Artist', label: 'Artist', icon: Palette, desc: 'Artists, musicians, creators.' },
  { id: 'Professional', label: 'Professional', icon: Briefcase, desc: 'Consultants, accountants, etc.' },
  { id: 'Local Shop', label: 'Local Shop', icon: Store, desc: 'Retail store, grocery, or local business.' },
  { id: 'Company', label: 'Company', icon: Building2, desc: 'Registered corporate entity.' },
  { id: 'Startup', label: 'Startup', icon: Zap, desc: 'Fast-growing tech or innovative business.' },
  { id: 'NGO', label: 'NGO', icon: ShieldCheck, desc: 'Non-profit or charity.' },
  { id: 'Distributor', label: 'Distributor', icon: Truck, desc: 'Supply chain distributor.' },
  { id: 'Wholesaler', label: 'Wholesaler', icon: Building2, desc: 'B2B seller of bulk goods.' },
  { id: 'Transporter', label: 'Transporter', icon: Truck, desc: 'Logistics and transportation.' },
  { id: 'Educational Institute', label: 'Educational Institute', icon: GraduationCap, desc: 'Schools or courses.' },
  { id: 'Hospitality', label: 'Hospitality', icon: Coffee, desc: 'Hotels, restaurants, cafes.' },
  { id: 'Construction', label: 'Construction', icon: HardHat, desc: 'Builders and contractors.' },
  { id: 'Repair Services', label: 'Repair Services', icon: Wrench, desc: 'Electronics or appliance repair.' },
  { id: 'Other', label: 'Other', icon: Globe, desc: 'Any other business category.' }
];`;

code = code.replace(/const BUSINESS_TYPES = \[[\s\S]*?\];/, newTypes);

// Now update the renderDynamicFields logic to correctly group them.

const renderLogicMatch = code.match(/const renderDynamicFields = \(\) => \{[\s\S]*?return null;\n  \};/);
if (renderLogicMatch) {
  const newRenderLogic = `const renderDynamicFields = () => {
    const type = formData.businessType;
    const pd = formData.profileData || {};

    if (['Service Provider', 'Carpenter', 'Tailor', 'Doctor', 'Lawyer', 'Freelancer', 'Professional', 'Repair Services'].includes(type)) {
      return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Skills / Expertise</label>
              <input name="skills" value={pd.skills || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. Plumbing, SEO, Consulting..." />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Experience (Years)</label>
              <input type="number" name="experience" value={pd.experience || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. 5" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Service Area</label>
              <input name="serviceArea" value={pd.serviceArea || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. City-wide, Global..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Working Hours</label>
                <input name="workingHours" value={pd.workingHours || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. 9 AM - 5 PM" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Starting Price</label>
                <input type="number" name="startingPrice" value={pd.startingPrice || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. 10" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Portfolio URL</label>
              <input name="portfolio" value={pd.portfolio || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="https://..." />
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center gap-3">
                <input type="checkbox" name="homeVisit" checked={pd.homeVisit === 'true'} onChange={(e) => setFormData({ ...formData, profileData: { ...pd, homeVisit: e.target.checked ? 'true' : 'false' } })} className="w-4 h-4 bg-slate-900 border-slate-800 rounded text-indigo-600" />
                <label className="text-sm font-medium text-slate-300">Home Service / On-site Visits</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" name="emergencyService" checked={pd.emergencyService === 'true'} onChange={(e) => setFormData({ ...formData, profileData: { ...pd, emergencyService: e.target.checked ? 'true' : 'false' } })} className="w-4 h-4 bg-slate-900 border-slate-800 rounded text-indigo-600" />
                <label className="text-sm font-medium text-slate-300">Emergency Service Available</label>
              </div>
            </div>
          </>
      );
    }
    
    if (['Farmer', 'Agriculture / Farmer'].includes(type)) {
      return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Farm / Land Size (Acres/Hectares)</label>
              <input name="farmSize" value={pd.farmSize || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. 50 Acres" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Main Crops / Produce</label>
              <input name="mainCrops" value={pd.mainCrops || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. Wheat, Apples, Dairy..." />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <input type="checkbox" name="organicCertified" checked={pd.organicCertified === 'true'} onChange={(e) => setFormData({ ...formData, profileData: { ...pd, organicCertified: e.target.checked ? 'true' : 'false' } })} className="w-4 h-4 bg-slate-900 border-slate-800 rounded text-indigo-600" />
              <label className="text-sm font-medium text-slate-300">Organic Certified</label>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <input type="checkbox" name="sellsWholesale" checked={pd.sellsWholesale === 'true'} onChange={(e) => setFormData({ ...formData, profileData: { ...pd, sellsWholesale: e.target.checked ? 'true' : 'false' } })} className="w-4 h-4 bg-slate-900 border-slate-800 rounded text-indigo-600" />
              <label className="text-sm font-medium text-slate-300">Sells Wholesale / Bulk</label>
            </div>
          </>
      );
    }

    if (['Manufacturer', 'Distributor', 'Wholesaler', 'Company'].includes(type)) {
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Factory / Warehouse Details</label>
              <textarea name="factoryDetails" value={pd.factoryDetails || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" rows={2} placeholder="Location, size, type..." />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Production Capacity</label>
              <input name="productionCapacity" value={pd.productionCapacity || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. 10,000 units/month" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Minimum Order Quantity (MOQ)</label>
              <input name="moq" value={pd.moq || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. 500 pieces" />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <input type="checkbox" name="exportReady" checked={pd.exportReady === 'true'} onChange={(e) => setFormData({ ...formData, profileData: { ...pd, exportReady: e.target.checked ? 'true' : 'false' } })} className="w-4 h-4 bg-slate-900 border-slate-800 rounded text-indigo-600" />
              <label className="text-sm font-medium text-slate-300">Export Ready</label>
            </div>
          </>
        );
    }

    if (['Product Seller', 'Local Shop'].includes(type)) {
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Product Categories Sold</label>
              <input name="productCategories" value={pd.productCategories || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. Electronics, Clothing..." />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <input type="checkbox" name="hasPhysicalStore" checked={pd.hasPhysicalStore === 'true'} onChange={(e) => setFormData({ ...formData, profileData: { ...pd, hasPhysicalStore: e.target.checked ? 'true' : 'false' } })} className="w-4 h-4 bg-slate-900 border-slate-800 rounded text-indigo-600" />
              <label className="text-sm font-medium text-slate-300">Has Physical Storefront</label>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <input type="checkbox" name="offersDelivery" checked={pd.offersDelivery === 'true'} onChange={(e) => setFormData({ ...formData, profileData: { ...pd, offersDelivery: e.target.checked ? 'true' : 'false' } })} className="w-4 h-4 bg-slate-900 border-slate-800 rounded text-indigo-600" />
              <label className="text-sm font-medium text-slate-300">Offers Local Delivery</label>
            </div>
          </>
        );
    }

    if (['Artist', 'Artist / Creator', 'Potter'].includes(type)) {
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Art Medium / Niche</label>
              <input name="artMedium" value={pd.artMedium || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="e.g. Digital Art, Ceramics, Music..." />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Portfolio Link</label>
              <input name="portfolio" value={pd.portfolio || ''} onChange={handleProfileDataChange} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white" placeholder="https://..." />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <input type="checkbox" name="acceptsCommissions" checked={pd.acceptsCommissions === 'true'} onChange={(e) => setFormData({ ...formData, profileData: { ...pd, acceptsCommissions: e.target.checked ? 'true' : 'false' } })} className="w-4 h-4 bg-slate-900 border-slate-800 rounded text-indigo-600" />
              <label className="text-sm font-medium text-slate-300">Accepts Custom Commissions</label>
            </div>
          </>
        );
    }

    return null;
  };`;
  code = code.replace(renderLogicMatch[0], newRenderLogic);
}

fs.writeFileSync('src/components/business/BusinessWizard.tsx', code);
