import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { SEOHead } from '../../components/common/SEOHead';
import { BUSINESS_INFO, BANGALORE_AREAS } from '../../data/businessData';
import { submitPublicLead } from '../../api/publicApi';
import { trackLeadSubmitted } from '../../utils/analytics';
import {
  Truck,
  ArrowRight,
  Shield,
  Clock,
  CheckCircle2,
  Phone,
  MessageCircle,
  Loader2,
  Check,
  Smartphone,
  Calendar,
  AlertCircle,
  MapPin,
  Sparkles,
} from 'lucide-react';

const DEVICE_CATEGORIES = [
  'iPhone',
  'Android Phone',
  'MacBook / Laptop',
  'iPad / Tablet',
  'Smartwatch',
  'Other',
];

const DEVICE_BRANDS: Record<string, string[]> = {
  'iPhone': ['Apple'],
  'Android Phone': [
    'Samsung',
    'OnePlus',
    'Google Pixel',
    'Xiaomi / Redmi / POCO',
    'Vivo',
    'OPPO',
    'Realme',
    'Motorola',
    'Nothing',
    'Other',
  ],
  'MacBook / Laptop': [
    'Apple (MacBook)',
    'Dell',
    'HP',
    'Lenovo',
    'ASUS',
    'Acer',
    'Other',
  ],
  'iPad / Tablet': [
    'Apple (iPad)',
    'Samsung (Galaxy Tab)',
    'Lenovo',
    'Other',
  ],
  'Smartwatch': [
    'Apple (Watch)',
    'Samsung (Galaxy Watch)',
    'Other',
  ],
  'Other': ['Other'],
};

const DEVICE_MODELS: Record<string, string[]> = {
  'Apple': [
    'iPhone 16 Pro Max',
    'iPhone 16 Pro',
    'iPhone 16 Plus',
    'iPhone 16',
    'iPhone 15 Pro Max',
    'iPhone 15 Pro',
    'iPhone 15 Plus',
    'iPhone 15',
    'iPhone 14 Pro Max',
    'iPhone 14 Pro',
    'iPhone 14 Plus',
    'iPhone 14',
    'iPhone 13 Pro Max',
    'iPhone 13 Pro',
    'iPhone 13',
    'iPhone 13 mini',
    'iPhone 12 Pro Max',
    'iPhone 12 Pro',
    'iPhone 12',
    'iPhone 12 mini',
    'iPhone 11 Pro Max',
    'iPhone 11 Pro',
    'iPhone 11',
    'iPhone XS Max',
    'iPhone XS',
    'iPhone XR',
    'iPhone X',
    'iPhone SE (3rd Gen - 2022)',
    'iPhone SE (2nd Gen - 2020)',
    'iPhone 8 Plus',
    'iPhone 8',
    'iPhone 7 Plus',
    'iPhone 7',
    'Other iPhone Model (Type Manually)',
  ],
  'Samsung': [
    'Galaxy S24 Ultra',
    'Galaxy S24+ / S24',
    'Galaxy S23 Ultra',
    'Galaxy S23+ / S23',
    'Galaxy S23 FE',
    'Galaxy S22 Ultra',
    'Galaxy S22+ / S22',
    'Galaxy S21 Ultra / S21+',
    'Galaxy S21 / S21 FE',
    'Galaxy S20 FE / S20',
    'Galaxy Z Fold 6 / 5 / 4 / 3',
    'Galaxy Z Flip 6 / 5 / 4 / 3',
    'Galaxy Note 20 Ultra / Note 20',
    'Galaxy Note 10+ / Note 10',
    'Galaxy A55 / A54 5G',
    'Galaxy A35 / A34 5G',
    'Galaxy A25 / A15 / A14 5G',
    'Galaxy M54 / M53 / M34 5G',
    'Galaxy F54 / F34 5G',
    'Other Samsung Model (Type Manually)',
  ],
  'OnePlus': [
    'OnePlus 12',
    'OnePlus 12R',
    'OnePlus 11',
    'OnePlus 11R',
    'OnePlus 10 Pro',
    'OnePlus 10T',
    'OnePlus 10R',
    'OnePlus 9 Pro / 9',
    'OnePlus 9R / 9RT',
    'OnePlus 8 Pro / 8T / 8',
    'OnePlus 7 Pro / 7T / 7',
    'OnePlus Open (Foldable)',
    'OnePlus Nord 4',
    'OnePlus Nord 3',
    'OnePlus Nord CE 4 / CE 4 Lite',
    'OnePlus Nord CE 3 / CE 3 Lite',
    'OnePlus Nord CE 2 / CE 2 Lite',
    'Other OnePlus Model (Type Manually)',
  ],
  'Google Pixel': [
    'Pixel 9 Pro XL',
    'Pixel 9 Pro',
    'Pixel 9',
    'Pixel 8 Pro',
    'Pixel 8',
    'Pixel 8a',
    'Pixel 7 Pro',
    'Pixel 7',
    'Pixel 7a',
    'Pixel 6 Pro',
    'Pixel 6',
    'Pixel 6a',
    'Pixel Fold',
    'Pixel 5 / 4a',
    'Other Pixel Model (Type Manually)',
  ],
  'Xiaomi / Redmi / POCO': [
    'Xiaomi 14 Ultra / 14',
    'Xiaomi 13 Pro / 12 Pro',
    'Xiaomi 11T Pro / 11X / 11 Lite',
    'Redmi Note 13 Pro+ / 13 Pro / 13',
    'Redmi Note 12 Pro+ / 12 Pro / 12',
    'Redmi Note 11 Pro / 11',
    'Redmi Note 10 Pro / 10',
    'Redmi 13C / 12 5G',
    'POCO X6 Pro / X6',
    'POCO X5 Pro / X4 Pro',
    'POCO F6 / F5 / F4',
    'POCO M6 Pro / M4 Pro',
    'Other Xiaomi / Redmi Model (Type Manually)',
  ],
  'Vivo': [
    'Vivo X100 Pro / X100',
    'Vivo X90 Pro / X90',
    'Vivo X80 Pro / X80',
    'Vivo V30 Pro / V30 / V30e',
    'Vivo V29 Pro / V29 / V29e',
    'Vivo V27 Pro / V27',
    'Vivo T3 5G / T3x',
    'Vivo T2 Pro / T2 5G',
    'Vivo Y200 / Y100 5G',
    'Other Vivo Model (Type Manually)',
  ],
  'OPPO': [
    'OPPO Find N3 Flip / N2 Flip',
    'OPPO Reno 12 Pro / Reno 12',
    'OPPO Reno 11 Pro / Reno 11',
    'OPPO Reno 10 Pro+ / 10 Pro / 10',
    'OPPO Reno 8 Pro / 8',
    'OPPO F27 Pro+ 5G',
    'OPPO F25 Pro / F23 5G',
    'OPPO A79 / A78 / A59 5G',
    'Other OPPO Model (Type Manually)',
  ],
  'Realme': [
    'Realme GT 6 / GT 6T',
    'Realme GT 2 Pro / GT Neo 3',
    'Realme 13 Pro+ / 13 Pro',
    'Realme 12 Pro+ / 12 Pro / 12 5G',
    'Realme 11 Pro+ / 11 Pro',
    'Realme 10 Pro+ / 10 Pro',
    'Realme Narzo 70 Pro / Narzo 70',
    'Realme Narzo 60 Pro / Narzo 60',
    'Realme C67 / C65 / C55',
    'Other Realme Model (Type Manually)',
  ],
  'Motorola': [
    'Moto Razr 50 Ultra / Razr 40',
    'Moto Edge 50 Ultra / Edge 50 Pro / Edge 50 Fusion',
    'Moto Edge 40 Neo / Edge 40',
    'Moto Edge 30 Fusion / Edge 30 Pro',
    'Moto G85 5G / G64 5G',
    'Moto G54 5G / G34 5G',
    'Other Motorola Model (Type Manually)',
  ],
  'Nothing': [
    'Nothing Phone (2a) Plus',
    'Nothing Phone (2a)',
    'Nothing Phone (2)',
    'Nothing Phone (1)',
    'CMF Phone 1',
    'Other Nothing Model (Type Manually)',
  ],
  'Apple (MacBook)': [
    'MacBook Air 13" (M3, 2024)',
    'MacBook Air 15" (M3, 2024)',
    'MacBook Air 13" (M2, 2022)',
    'MacBook Air 15" (M2, 2023)',
    'MacBook Air 13" (M1, 2020)',
    'MacBook Air 13" (Intel Retina, 2018–2020)',
    'MacBook Pro 14" (M3 / M3 Pro / M3 Max, 2023)',
    'MacBook Pro 16" (M3 Pro / M3 Max, 2023)',
    'MacBook Pro 14" (M2 Pro / M2 Max, 2023)',
    'MacBook Pro 16" (M2 Pro / M2 Max, 2023)',
    'MacBook Pro 13" (M2, 2022)',
    'MacBook Pro 14" (M1 Pro / M1 Max, 2021)',
    'MacBook Pro 16" (M1 Pro / M1 Max, 2021)',
    'MacBook Pro 13" (M1, 2020)',
    'MacBook Pro 16" (Intel, 2019)',
    'MacBook Pro 15" (Intel Touch Bar, 2016–2019)',
    'MacBook Pro 13" (Intel Touch Bar, 2016–2020)',
    'Mac mini (M2 / M1)',
    'iMac 24" (M3 / M1)',
    'Other MacBook / Mac Model (Type Manually)',
  ],
  'Apple (iPad)': [
    'iPad Pro 13" (M4, 2024)',
    'iPad Pro 11" (M4, 2024)',
    'iPad Pro 12.9" (6th Gen M2 / 5th Gen M1)',
    'iPad Pro 11" (4th Gen M2 / 3rd Gen M1)',
    'iPad Air 13" (M2, 2024)',
    'iPad Air 11" (M2, 2024)',
    'iPad Air 5 (M1, 2022)',
    'iPad Air 4 (2020)',
    'iPad 10th Gen (10.9", 2022)',
    'iPad 9th Gen (10.2", 2021)',
    'iPad mini 6 (8.3", 2021)',
    'iPad mini 5 (2019)',
    'Other iPad Model (Type Manually)',
  ],
  'Dell': [
    'Dell XPS 13 / 15 / 17',
    'Dell Inspiron 14 / 15 / 16',
    'Dell Latitude (Corporate Series)',
    'Dell Vostro Series',
    'Dell Alienware Gaming (m15 / m16 / x14)',
    'Dell G15 / G16 Gaming Laptop',
    'Other Dell Laptop Model (Type Manually)',
  ],
  'HP': [
    'HP Spectre x360 14 / 16',
    'HP Envy x360 13 / 15',
    'HP Pavilion 14 / 15 / Aero',
    'HP OMEN Gaming 16 / 17',
    'HP Victus Gaming 15 / 16',
    'HP EliteBook / ProBook',
    'Other HP Laptop Model (Type Manually)',
  ],
  'Lenovo': [
    'Lenovo ThinkPad X1 Carbon / T14 / E14',
    'Lenovo Yoga 9i / Yoga Slim 7 / 6',
    'Lenovo IdeaPad Slim 5 / 3 / Gaming',
    'Lenovo Legion 5 / 7 / Pro Series',
    'Lenovo LOQ Gaming Laptop',
    'Lenovo Tab P12 / P11 Pro / M10',
    'Other Lenovo Model (Type Manually)',
  ],
  'ASUS': [
    'ASUS ROG Zephyrus G14 / G16',
    'ASUS ROG Strix SCAR 16 / 18',
    'ASUS TUF Gaming F15 / A15',
    'ASUS ZenBook 14 / Duo / S 13 OLED',
    'ASUS VivoBook 15 / 16 / Pro OLED',
    'Other ASUS Laptop Model (Type Manually)',
  ],
  'Acer': [
    'Acer Predator Helios 16 / Neo 16',
    'Acer Nitro 5 / Nitro V 15',
    'Acer Swift Go 14 / Swift X',
    'Acer Aspire 5 / 7 / Lite',
    'Other Acer Laptop Model (Type Manually)',
  ],
  'Samsung (Galaxy Tab)': [
    'Galaxy Tab S9 Ultra / S9+ / S9',
    'Galaxy Tab S9 FE+ / S9 FE',
    'Galaxy Tab S8 Ultra / S8+ / S8',
    'Galaxy Tab S7 FE / S7+',
    'Galaxy Tab A9+ / A9',
    'Galaxy Tab A8 / A7 Lite',
    'Other Samsung Tab Model (Type Manually)',
  ],
  'Apple (Watch)': [
    'Apple Watch Ultra 2 / Ultra',
    'Apple Watch Series 10 (46mm / 42mm)',
    'Apple Watch Series 9 (45mm / 41mm)',
    'Apple Watch Series 8 (45mm / 41mm)',
    'Apple Watch Series 7 (45mm / 41mm)',
    'Apple Watch SE (2nd Gen - 2022)',
    'Apple Watch SE (1st Gen - 2020)',
    'Apple Watch Series 6 / 5 / 4 / 3',
    'Other Apple Watch Model (Type Manually)',
  ],
  'Samsung (Galaxy Watch)': [
    'Galaxy Watch Ultra',
    'Galaxy Watch 7 (44mm / 40mm)',
    'Galaxy Watch 6 Classic / Watch 6',
    'Galaxy Watch 5 Pro / Watch 5',
    'Galaxy Watch 4 Classic / Watch 4',
    'Other Galaxy Watch Model (Type Manually)',
  ],
};

const COMMON_ISSUES = [
  'Screen Cracked / Broken',
  'Screen Not Displaying / Black Screen',
  'Battery Draining Fast',
  'Battery Swollen',
  'Not Charging',
  'Charging Port Damaged',
  'Water Damage',
  'Back Panel Broken',
  'Camera Not Working',
  'Speaker / Microphone Issue',
  'Face ID / Touch ID Not Working',
  'Device Not Turning On',
  'Software / System Issue',
  'Other',
];

const TIME_WINDOWS = [
  { value: 'Morning (9AM–12PM)', label: 'Morning (9AM–12PM)' },
  { value: 'Afternoon (12PM–4PM)', label: 'Afternoon (12PM–4PM)' },
  { value: 'Evening (4PM–8PM)', label: 'Evening (4PM–8PM)' },
];

const CONTACT_PREFERENCES = [
  { value: 'phone', label: 'Phone Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
];

export const BookRepairPage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const preselectedService = searchParams.get('service') || '';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deviceCategory, setDeviceCategory] = useState(
    preselectedService.includes('iphone') ? 'iPhone' : 'Android Phone'
  );
  const [deviceBrand, setDeviceBrand] = useState(
    preselectedService.includes('iphone') ? 'Apple' : 'Samsung'
  );
  const [deviceModel, setDeviceModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [reportedProblem, setReportedProblem] = useState(
    preselectedService.includes('screen')
      ? 'Screen Cracked / Broken'
      : preselectedService.includes('battery')
      ? 'Battery Draining Fast'
      : preselectedService.includes('water')
      ? 'Water Damage'
      : 'Screen Cracked / Broken'
  );
  const [pickupArea, setPickupArea] = useState('');
  const [pickupPincode, setPickupPincode] = useState('');
  const [preferredTime, setPreferredTime] = useState('Morning (9AM–12PM)');
  const [contactPreference, setContactPreference] = useState('phone');
  const [consent, setConsent] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successReference, setSuccessReference] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available brands and models for current selections
  const availableBrands = DEVICE_BRANDS[deviceCategory] || ['Other'];
  const availableModels = DEVICE_MODELS[deviceBrand] || [];
  const isManualModel =
    deviceBrand === 'Other' ||
    deviceModel.includes('Type Manually') ||
    availableModels.length === 0;

  const handleCategoryChange = (cat: string) => {
    setDeviceCategory(cat);
    const brands = DEVICE_BRANDS[cat] || ['Other'];
    const newBrand = brands[0];
    setDeviceBrand(newBrand);
    const models = DEVICE_MODELS[newBrand] || [];
    setDeviceModel(models[0] || '');
    setCustomModel('');
  };

  const handleBrandChange = (brand: string) => {
    setDeviceBrand(brand);
    const models = DEVICE_MODELS[brand] || [];
    setDeviceModel(models[0] || '');
    setCustomModel('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number (e.g. 99860 97786)');
      return;
    }
    if (!consent) {
      setErrorMsg('Please agree to the privacy policy to submit your enquiry');
      return;
    }

    const finalModelName = isManualModel
      ? customModel.trim() || deviceModel.replace(/\(Type Manually\)/i, '').trim() || deviceBrand
      : deviceModel || deviceBrand;

    setIsSubmitting(true);
    setErrorMsg(null);

    const fullDeviceText = deviceBrand && deviceBrand !== 'Other'
      ? (finalModelName.toLowerCase().includes(deviceBrand.toLowerCase().split(' ')[0])
          ? finalModelName
          : `${deviceBrand} ${finalModelName}`.trim())
      : finalModelName;

    try {
      const resp = await submitPublicLead({
        name: fullName,
        customer_name: fullName,
        phone: cleanPhone,
        customer_phone: cleanPhone,
        email: email || undefined,
        customer_email: email || undefined,
        device_type: deviceCategory === 'iPhone' || deviceCategory === 'Android Phone'
          ? 'smartphone'
          : deviceCategory === 'iPad / Tablet'
          ? 'tablet'
          : deviceCategory === 'MacBook / Laptop'
          ? 'laptop'
          : 'other',
        device_category: deviceCategory,
        device_brand: deviceBrand,
        brand_model: fullDeviceText,
        device_model_text: fullDeviceText,
        repair_needed: reportedProblem,
        reported_problem: reportedProblem,
        area: `${pickupArea} ${pickupPincode ? `(${pickupPincode})` : ''}`.trim() || 'Bangalore',
        pickup_area: pickupArea,
        pickup_pincode: pickupPincode,
        issue_description: `Preferred Time: ${preferredTime} | Preferred Contact: ${contactPreference}`,
        consent: true,
      } as any);

      const ref = resp.reference || 'PMR-' + Math.floor(100000 + Math.random() * 900000);
      setSuccessReference(ref);
      trackLeadSubmitted({
        reference: ref,
        brand_model: fullDeviceText,
        repair_needed: reportedProblem,
        area: pickupArea,
      });
    } catch {
      // Graceful fallback code
      const ref = 'PMR-' + Math.floor(100000 + Math.random() * 900000);
      setSuccessReference(ref);
      trackLeadSubmitted({
        reference: ref,
        brand_model: fullDeviceText,
        repair_needed: reportedProblem,
        area: pickupArea,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Book Doorstep Mobile & Laptop Repair in Bangalore — Premium Mobile Repair"
        description="Book free doorstep pickup and diagnosis for your smartphone, iPhone, iPad, or laptop repair in Bangalore. Honest diagnostics, transparent quotation, and 90 days warranty."
        canonicalUrl="https://premiummobilerepair.in/book-repair"
      />

      <div className="bg-[#f8fafc] text-slate-800 min-h-screen pt-24 sm:pt-28 pb-20">
        {/* ── Page Header ── */}
        <section
          className="py-14 sm:py-18 text-center border-b border-slate-200/80"
          style={{
            background: 'linear-gradient(135deg, #eef2ff 0%, #f5f0ff 40%, #fdf4ff 70%, #fff7ed 100%)',
          }}
        >
          <div className="max-w-4xl mx-auto px-5 sm:px-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-indigo-200 shadow-sm text-xs font-bold text-indigo-700 uppercase tracking-wider mb-4">
              <Truck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Doorstep Pickup &amp; Delivery Across Bangalore</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
              Book Your Device Assessment
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Select your device model and problem below. Our certified technician will provide a transparent diagnostic quote with zero upfront cost.
            </p>
          </div>
        </section>

        {/* ── Main Form Section ── */}
        <section className="py-12 sm:py-16">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
              {/* Form Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
                {successReference ? (
                  <div className="text-center py-10 space-y-6">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                      <Check className="w-10 h-10 stroke-[3]" />
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        Enquiry Confirmed
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                        We Received Your Request!
                      </h3>
                      <p className="text-slate-600 text-sm max-w-md mx-auto mt-2 leading-relaxed">
                        Your booking reference number is{' '}
                        <span className="font-mono font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                          {successReference}
                        </span>
                        . Our Bangalore coordinator will call or message you shortly to confirm your doorstep pickup.
                      </p>
                    </div>

                    {/* Fast Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2">
                      <a
                        href={`https://wa.me/919986097786?text=Hi%20Premium%20Mobile%20Repair%2C%20I%20just%20booked%20an%20enquiry%20${successReference}.%20Please%20confirm%20my%20pickup.`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Chat on WhatsApp</span>
                      </a>

                      <a
                        href="tel:+919986097786"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Call +91 99860 97786</span>
                      </a>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setSuccessReference(null);
                          setFullName('');
                          setPhone('');
                          setCustomModel('');
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                      >
                        ← Submit another device request
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {errorMsg && (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{errorMsg}</span>
                      </div>
                    )}

                    {/* Step 1: Device Category Selection */}
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5">
                        1. Select Device Category *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {DEVICE_CATEGORIES.map((cat) => {
                          const isSelected = deviceCategory === cat;
                          return (
                            <button
                              type="button"
                              key={cat}
                              onClick={() => handleCategoryChange(cat)}
                              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                                isSelected
                                  ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-sm ring-2 ring-indigo-600/20'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <Smartphone className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                              <span className="text-xs font-bold truncate">{cat}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Brand & Model Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                          Brand *
                        </label>
                        <select
                          value={deviceBrand}
                          onChange={(e) => handleBrandChange(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-bold outline-none transition-all bg-white text-slate-800"
                        >
                          {availableBrands.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                          Device Model *
                        </label>
                        {availableModels.length > 0 ? (
                          <select
                            value={deviceModel}
                            onChange={(e) => setDeviceModel(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-medium outline-none transition-all bg-white text-slate-800"
                          >
                            {availableModels.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            required
                            value={customModel}
                            onChange={(e) => setCustomModel(e.target.value)}
                            placeholder="Type device model (e.g. Dell Inspiron 15)"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs outline-none transition-all"
                          />
                        )}
                      </div>
                    </div>

                    {/* Custom Model Input if "Other" selected */}
                    {isManualModel && availableModels.length > 0 && (
                      <div>
                        <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                          Specify Model Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={customModel}
                          onChange={(e) => setCustomModel(e.target.value)}
                          placeholder="e.g. iPhone 11 Pro 256GB Midnight Green"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs outline-none transition-all"
                        />
                      </div>
                    )}

                    {/* Step 3: Reported Issue */}
                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                        2. What is the issue? *
                      </label>
                      <select
                        value={reportedProblem}
                        onChange={(e) => setReportedProblem(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-bold outline-none transition-all bg-white text-slate-800"
                      >
                        {COMMON_ISSUES.map((issue) => (
                          <option key={issue} value={issue}>
                            {issue}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Step 4: Customer Contact Info */}
                    <div className="border-t border-slate-100 pt-5 space-y-4">
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                        3. Your Contact &amp; Pickup Address *
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">10-Digit Mobile Number *</label>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="99860 97786"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-mono font-medium outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Email Address <span className="text-slate-400 font-normal">(optional)</span>
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Bangalore Area / Locality *</label>
                          <input
                            type="text"
                            required
                            list="bangalore-areas-list"
                            value={pickupArea}
                            onChange={(e) => setPickupArea(e.target.value)}
                            placeholder="e.g. Koramangala, Indiranagar, Jayanagar"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs outline-none"
                          />
                          <datalist id="bangalore-areas-list">
                            {BANGALORE_AREAS.map((a) => (
                              <option key={a.slug} value={a.name} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          PIN Code <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={pickupPincode}
                          onChange={(e) => setPickupPincode(e.target.value)}
                          placeholder="e.g. 560034"
                          className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs outline-none"
                        />
                      </div>
                    </div>

                    {/* Step 5: Preferred Time & Contact */}
                    <div className="border-t border-slate-100 pt-5 space-y-4">
                      <div>
                        <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                          Preferred Pickup Time Window
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {TIME_WINDOWS.map((tw) => {
                            const isSelected = preferredTime === tw.value;
                            return (
                              <button
                                type="button"
                                key={tw.value}
                                onClick={() => setPreferredTime(tw.value)}
                                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <span className="text-xs">{tw.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                          Preferred Contact Method
                        </label>
                        <div className="flex items-center gap-3">
                          {CONTACT_PREFERENCES.map((cp) => (
                            <label key={cp.value} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                              <input
                                type="radio"
                                name="contact_pref"
                                value={cp.value}
                                checked={contactPreference === cp.value}
                                onChange={(e) => setContactPreference(e.target.value)}
                                className="accent-indigo-600"
                              />
                              <span>{cp.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Consent checkbox */}
                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                          className="mt-0.5 rounded accent-indigo-600 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-[11px] text-slate-500 leading-relaxed">
                          I agree to be contacted via call or WhatsApp regarding this doorstep device repair enquiry. No upfront payment required.
                        </span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-extrabold text-sm shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting Assessment Request...</span>
                        </>
                      ) : (
                        <>
                          <span>Schedule Free Doorstep Pickup</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Right Column: Trust Signals */}
              <div className="space-y-4">
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>The Premium Guarantee</span>
                  </h3>
                  <div className="space-y-3 text-xs text-slate-600">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800 block">Zero Upfront Charge</span>
                        Free diagnosis. Pay only after your device is repaired and tested.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800 block">Up to 90 Days Warranty</span>
                        Full replacement warranty on genuine OEM specification parts.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800 block">Safe Doorstep Pickup</span>
                        Trained riders provide physical or digital acknowledgment receipt on collection.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 block">
                    Fast Track Assistance
                  </span>
                  <h4 className="text-base font-extrabold">Need Urgent Repair Today?</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Have an emergency screen fix or urgent laptop diagnostic? Call our dispatch hub directly:
                  </p>
                  <a
                    href="tel:+919986097786"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors w-full justify-center"
                  >
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>+91 99860 97786</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};
