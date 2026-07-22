/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FAQItem {
  questionEn: string;
  questionHi: string;
  answerEn: string;
  answerHi: string;
}

export interface StepItem {
  stepNumber: number;
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
}

export interface DocSection {
  id: string;
  titleEn: string;
  titleHi: string;
  categoryEn: string;
  categoryHi: string;
  badge?: string;
  summaryEn: string;
  summaryHi: string;
  
  // Standard Required Subsections
  overviewEn: string;
  overviewHi: string;
  
  purposeEn: string;
  purposeHi: string;
  
  howItWorksSteps: StepItem[];
  
  benefitsEn: string[];
  benefitsHi: string[];
  
  tipsEn: string[];
  tipsHi: string[];
  
  bestPracticesEn: string[];
  bestPracticesHi: string[];
  
  notesEn: string[];
  notesHi: string[];
  
  faqs: FAQItem[];
  keywords?: string[];
  relatedSectionIds?: string[];
}

export const DOCUMENTATION_DATA: DocSection[] = [
  // ==========================================
  // 1. WELCOME TO PI BUSINESS MARKET
  // ==========================================
  {
    id: 'welcome',
    titleEn: 'Welcome to Pi Business Market',
    titleHi: 'Pi Business Market में आपका स्वागत है',
    categoryEn: 'Getting Started',
    categoryHi: 'शुरुआत करें',
    badge: 'Overview',
    summaryEn: 'The definitive enterprise documentation portal for Pi Business Market—the premier Web3 marketplace and commerce infrastructure engineered for the Pi Network ecosystem.',
    summaryHi: 'Pi Business Market का आधिकारिक एंटरप्राइज डॉक्यूमेंटेशन पोर्टल—Pi Network इकोसिस्टम के लिए निर्मित प्रीमियम Web3 मर्चेंट कॉमर्स प्लेटफॉर्म।',

    overviewEn: `Pi Business Market is an enterprise-grade Web3 commerce platform engineered specifically for the Pi Network ecosystem. Built on decentralized principles and backed by institutional-grade security, the platform seamlessly connects Pi cryptocurrency holders (Pioneers), verified local & international merchants, service providers, and warehouse logistics networks. By bridging the gap between Pi Network's global user base and real-world utility, Pi Business Market provides a complete end-to-end commerce suite including product catalogs, service booking, job recruitment, multi-warehouse fulfillment, automated escrow payments, and customer relationship management (CRM).`,
    overviewHi: `Pi Business Market एक एंटरप्राइज-ग्रेड Web3 ई-कॉमर्स प्लेटफॉर्म है जिसे विशेष रूप से Pi Network इकोसिस्टम के लिए डिज़ाइन किया गया है। यह प्लेटफॉर्म Pi क्रिप्टोकरंसी धारकों (Pioneers), सत्यापित स्थानीय एवं अंतर्राष्ट्रीय व्यापारियों (Merchants), सेवा प्रदाताओं और लॉजिस्टिक्स वेयरहाउस नेटवर्क को एक सुरक्षित डिजिटल प्लेटफॉर्म पर जोड़ता है। यह प्लेटफॉर्म वास्तविक व्यापारिक उपयोग (Real-World Utility) को बढ़ावा देता है, जिसमें प्रोडक्ट कैटलॉग, सर्विस बुकिंग, जॉब रिक्रूटमेंट, मल्टी-वेयरहाउस फुलफिलमेंट, ऑटोमेटेड एस्क्रौ पेमेंट्स (Escrow Payments) और कस्टमर रिलेशनशिप मैनेजमेंट (CRM) शामिल हैं।`,

    purposeEn: `The primary purpose of Pi Business Market is to serve as the definitive real-world utility engine for Pi Network. It transforms Pi from a mined token into a universally accepted currency for goods, professional services, B2B inventory wholesale, logistics, and labor exchange. The platform eliminates middleman transaction fees, protects buyer and seller funds through cryptographic escrow, and provides merchants with enterprise-class tools to digitize and scale their operations globally.`,
    purposeHi: `Pi Business Market का मुख्य उद्देश्य Pi Network के लिए एक वास्तविक और मजबूत यूटिलिटी इंफ्रास्ट्रक्चर (Utility Infrastructure) प्रदान करना है। यह Pi को केवल एक डिजिटल टोकन से बदलकर वास्तविक सामान (Goods), पेशेवर सेवाओं (Services), थोक व्यापार (Wholesale Inventory), लॉजिस्टिक्स और रोज़गार (Jobs) के लिए सर्वमान्य भुगतान माध्यम बनाता है। प्लेटफॉर्म बिचौलियों के शुल्क को समाप्त करता है, एस्क्रौ वॉल्ट (Escrow Vault) के माध्यम से खरीदार और विक्रेता दोनों के धन की सुरक्षा करता है, और व्यापारियों को वैश्विक स्तर पर अपने व्यवसाय का विस्तार करने के लिए एंटरप्राइज टूल प्रदान करता है।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Account Onboarding & Pi SDK Authentication',
        titleHi: 'अकाउंट ऑनबोर्डिंग और Pi SDK ऑथेंटिकेशन',
        descriptionEn: 'Users authenticate via the official Pi Browser SDK or verified sandbox environment, establishing a secure cryptographic link to their Pi Network wallet without revealing private keys.',
        descriptionHi: 'उपयोगकर्ता Pi Browser के अधिकृत SDK या सुरक्षित सैंडबॉक्स वातावरण द्वारा ऑथेंटिकेट होते हैं। बिना प्राइवेट की (Private Key) साझा किए Pi वॉलेट से सुरक्षित संबंध स्थापित होता है।'
      },
      {
        stepNumber: 2,
        titleEn: 'Role Selection & Business Profile Verification',
        titleHi: 'भूमिका चयन और बिज़नेस प्रोफाइल वेरीफिकेशन',
        descriptionEn: 'Select an operational identity as a Buyer (Pioneer), Store Merchant, Warehouse Fulfillment Partner, Service Provider, or Hiring Employer with optional KYC badge verification.',
        descriptionHi: 'अपनी भूमिका चुनें: खरीदार (Buyer), स्टोर मर्चेंट (Store Merchant), वेयरहाउस पार्टनर, सर्विस प्रोवाइडर या नियोक्ता (Employer)। सुरक्षित KYC वेरिफिकेशन से ट्रस्ट बैज प्राप्त करें।'
      },
      {
        stepNumber: 3,
        titleEn: 'Discovery & Transaction Execution',
        titleHi: 'खोज और सुरक्षित ट्रांजैक्शन',
        descriptionEn: 'Explore verified stores, global inventory, and local services. Execute order checkouts where Pi tokens are locked into a secure Smart Escrow Contract until fulfillment confirmation.',
        descriptionHi: 'सत्यापित स्टोर और सेवाओं को ब्राउज़ करें। चेकआउट पर आपकी Pi राशि सुरक्षित स्मार्ट एस्क्रौ में लॉक हो जाती है, जो डिलीवरी की पुष्टि के बाद ही मर्चेंट को जारी की जाती है।'
      },
      {
        stepNumber: 4,
        titleEn: 'Fulfillment & Settlement',
        titleHi: 'फुलफिलमेंट और पेमेंट सेटलमेंट',
        descriptionEn: 'Sellers fulfill orders via integrated tracking partners. Upon delivery verification, funds release automatically from Escrow into the seller wallet with zero platform surcharge.',
        descriptionHi: 'विक्रेता एकीकृत वेयरहाउस या कूरियर के माध्यम से ऑर्डर डिलीवर करते हैं। डिलीवरी कन्फर्म होते ही एस्क्रौ से फंड विक्रेता के वॉलेट में तुरंत ट्रांसफर हो जाता है।'
      }
    ],

    benefitsEn: [
      'Zero-fee peer-to-peer and merchant Web3 payments using Pi currency.',
      'Cryptographic Smart Escrow protecting both buyers and sellers against fraud.',
      'Unified enterprise dashboard covering catalog, inventory, B2B wholesale, and recruitment.',
      'Instant cross-border settlement without traditional banking or exchange friction.',
      'Full compatibility with mobile Pi Browser and desktop Web3 environments.'
    ],
    benefitsHi: [
      'Pi करंसी का उपयोग करके ज़ीरो-फीस (Zero-Fee) पीयर-टू-पीयर और मर्चेंट भुगतान्स।',
      'स्मार्ट एस्क्रौ (Smart Escrow) तकनीक जो खरीदारों और विक्रेताओं दोनों को धोखाधड़ी से बचाती है।',
      'कैटलॉग, इन्वेंट्री, B2B होलसेल और रिक्रूटमेंट के लिए एकीकृत एंटरप्राइज डैशबोर्ड।',
      'पारंपरिक बैंकिंग बाधाओं के बिना त्वरित अंतर्राष्ट्रीय लेनदेन सेटलमेंट (Instant Settlement)।',
      'मोबाइल Pi Browser और डेस्कटॉप दोनों वातावरणों के लिए पूर्ण संगतता।'
    ],

    tipsEn: [
      'Always access Pi Business Market through the official Pi Browser for direct wallet authorization.',
      'Keep your business profile details up to date to earn higher merchant trust scores and verification badges.',
      'Utilize the Built-in Testnet Faucet in Sandbox mode to test order workflows before live Mainnet deployment.'
    ],
    tipsHi: [
      'वॉलेट ऑथेंटिकेशन के लिए हमेशा आधिकारिक Pi Browser के माध्यम से Pi Business Market खोलें।',
      'उच्च मर्चेंट ट्रस्ट स्कोर और वेरिफिकेशन बैज प्राप्त करने के लिए अपनी प्रोफाइल जानकारी हमेशा अपडेट रखें।',
      'लाइव मैननेट (Mainnet) तैनाती से पहले वर्कफ़्लो टेस्ट करने के लिए सैंडबॉक्स मोड में built-in Faucet का उपयोग करें।'
    ],

    bestPracticesEn: [
      'Merchants should maintain detailed product descriptions and high-resolution images to minimize dispute rates.',
      'Buyers must review delivery confirmations promptly to release escrow payments to sellers.',
      'Logistics managers should update tracking status codes continuously in the Fulfillment Center.'
    ],
    bestPracticesHi: [
      'विवाद की संभावना घटाने के लिए विक्रेता हमेशा उत्पादों के सटीक विवरण और स्पष्ट चित्र अपलोड करें।',
      'खरीदार सामान प्राप्त होने के तुरंत बाद डिलीवरी की पुष्टि करें ताकि विक्रेताओं को समय पर भुगतान मिल सके।',
      'लॉजिस्टिक्स मैनेजर फुलफिलमेंट सेंटर में ट्रैकिंग स्टेटस कोड लगातार अपडेट करते रहें।'
    ],

    notesEn: [
      'Note: Non-KYC verified accounts may have daily transaction limits imposed for ecosystem safety.',
      'Warning: Never share your Pi Wallet passphrase with anyone. Pi Business Market staff will never request your private key or seed phrase.',
      'Info: Sandbox transactions utilize Pi Testnet tokens and carry zero real-world financial risk.'
    ],
    notesHi: [
      'नोट: इकोसिस्टम की सुरक्षा के लिए बिना KYC वाले खातों पर दैनिक लेनदेन सीमा लागू हो सकती है।',
      'चेतावनी: अपना Pi Wallet Passphrase कभी किसी के साथ साझा न करें। Pi Business Market टीम कभी आपकी प्राइवेट की नहीं मांगती।',
      'सूचना: सैंडबॉक्स मोड में किए गए सभी लेनदेन Pi Testnet टोकन का उपयोग करते हैं और पूर्णतः सुरक्षित हैं।'
    ],

    faqs: [
      {
        questionEn: 'What is Pi Business Market?',
        questionHi: 'Pi Business Market क्या है?',
        answerEn: 'Pi Business Market is a complete enterprise marketplace and Web3 utility platform designed for Pi Network users to buy, sell, hire, and manage business operations using Pi cryptocurrency.',
        answerHi: 'Pi Business Market एक पूर्ण एंटरप्राइज मार्केटप्लेस और Web3 यूटिलिटी प्लेटफॉर्म है जहाँ Pi नेटवर्क यूज़र्स Pi करंसी का उपयोग करके सामान, सेवाएं खरीद और बेच सकते हैं।'
      },
      {
        questionEn: 'How do I log into Pi Business Market?',
        questionHi: 'मैं Pi Business Market में कैसे लॉगिन करूं?',
        answerEn: 'Open the Pi Browser app on your mobile device or open the desktop web portal. Click "Authenticate with Pi SDK" to sign in securely without passwords.',
        answerHi: 'अपने मोबाइल पर Pi Browser खोलें या वेब पोर्टल पर जाएं। "Authenticate with Pi SDK" पर क्लिक करके बिना पासवर्ड के सुरक्षित रूप से लॉगिन करें।'
      },
      {
        questionEn: 'Is my Pi cryptocurrency safe during transactions?',
        questionHi: 'क्या लेनदेन के दौरान मेरी Pi करंसी सुरक्षित है?',
        answerEn: 'Yes. Every transaction is protected by our Smart Escrow Vault. Funds remain locked in escrow until the buyer confirms receipt of goods or services.',
        answerHi: 'हाँ! सभी लेनदेन स्मार्ट एस्क्रौ वॉल्ट (Smart Escrow Vault) द्वारा सुरक्षित हैं। डिलीवरी की पुष्टि होने तक राशि एस्क्रौ में सुरक्षित लॉक रहती है।'
      },
      {
        questionEn: 'Can I use Pi Business Market if I am not a business owner?',
        questionHi: 'क्या मैं बिजनेस ऑनर न होने पर भी Pi Business Market का इस्तेमाल कर सकता हूं?',
        answerEn: 'Absolutely! Regular users (Buyers/Pioneers) can shop for products, hire professionals, apply for jobs, and earn loyalty rewards using Pi.',
        answerHi: 'बिल्कुल! सामान्य ग्राहक (Buyers) उत्पादों की खरीदारी, सेवाओं की बुकिंग, नौकरियों के लिए आवेदन और रिवार्ड्स अर्जित कर सकते हैं।'
      }
    ]
  },

  // ==========================================
  // 2. ABOUT THE PLATFORM - PLATFORM OVERVIEW
  // ==========================================
  {
    id: 'platform-overview',
    titleEn: 'Platform Overview',
    titleHi: 'प्लेटफॉर्म का अवलोकन (Platform Overview)',
    categoryEn: 'About the Platform',
    categoryHi: 'प्लेटफॉर्म के बारे में',
    badge: 'Core Concept',
    summaryEn: 'An end-to-end architectural and functional overview of Pi Business Market, covering multi-tenancy, commerce capabilities, and Web3 integration.',
    summaryHi: 'Pi Business Market का संपूर्ण आर्किटेक्चरल और फंक्शनल अवलोकन—मल्टी-टेनेंसी, ई-कॉमर्स क्षमताओं और Web3 इंटीग्रेशन के साथ।',

    overviewEn: `Pi Business Market is built as a multi-tenant, modular enterprise marketplace ecosystem. Unlike traditional simple e-commerce storefronts, Pi Business Market operates as an all-in-one business operating system. It integrates consumer e-commerce, B2B supplier marketplace, multi-warehouse inventory management, gig & job marketplace, service scheduling, and customer analytics under a single unified dashboard powered by the Pi Network blockchain.`,
    overviewHi: `Pi Business Market एक मल्टी-टैलेंट और मॉड्यूलर एंटरप्राइज प्लेटफॉर्म है। यह केवल एक साधारण ई-कॉमर्स स्टोर नहीं है, बल्कि एक ऑल-इन-वन बिज़नेस ऑपरेटिंग सिस्टम (Business OS) है। इसमें रिटेल ई-कॉमर्स, B2B सप्लायर मार्केटप्लेस, मल्टी-वेयरहाउस इन्वेंटरी मैनेजमेंट, जॉब एवं गिग मार्केटप्लेस, सर्विस शेड्यूलिंग और कस्टमर एनालिटिक्स को Pi नेटवर्क ब्लॉकचेन द्वारा एकीकृत किया गया है।`,

    purposeEn: `The core purpose of Platform Overview is to provide merchants, enterprises, developers, and Pioneers with a clear understanding of the platform's multi-layered structure. It enables businesses to transition smoothly from legacy fiat platforms to Web3 decentralized commerce while retaining enterprise control over catalogs, orders, inventory, staff permissions, and payments.`,
    purposeHi: `प्लेटफॉर्म अवलोकन का मुख्य उद्देश्य उद्यमियों, डेवलपर्स और खरीदारों को प्लेटफॉर्म की बहु-स्तरीय संरचना समझाना है। यह पारंपरिक व्यवसायों को कैटलॉग, इन्वेंटरी, ऑर्डर और पेमेंट्स पर पूर्ण नियंत्रण रखते हुए आसानी से Web3 डिजिटल कॉमर्स में स्थानांतरित होने में मदद करता है।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Unified Architecture Access',
        titleHi: 'एकीकृत आर्किटेक्चर एक्सेस',
        descriptionEn: 'Connect via client-side Web3 layer or server-side API proxy. Authentication resolves your identity across all sub-modules simultaneously.',
        descriptionHi: 'वेब3 क्लाइंट या सर्वर-साइड API प्रॉक्सी द्वारा कनेक्ट करें। ऑथेंटिकेशन आपकी पहचान को सभी मॉड्यूल्स में सुरक्षित रूप से लिंक कर देता है।'
      },
      {
        stepNumber: 2,
        titleEn: 'Multi-Storefront Management',
        titleHi: 'मल्टी-स्टोरफ्रंट मैनेजमेंट',
        descriptionEn: 'Merchants create multiple virtual storefronts, configure product categories, set pricing in Pi (with real-time USD index reference), and manage stock levels.',
        descriptionHi: 'व्यापारी कई वर्चुअल स्टोर बना सकते हैं, Pi करंसी में कीमतें निर्धारित कर सकते हैं (रियल-टाइम USD रेफरेंस के साथ) और इन्वेंटरी प्रबंधित कर सकते हैं।'
      },
      {
        stepNumber: 3,
        titleEn: 'Escrow-Backed Commerce Pipeline',
        titleHi: 'एस्क्रौ-बेक्ड कॉमर्स पाइपलाइन',
        descriptionEn: 'Orders flow through a deterministic state machine: Draft → Locked in Escrow → In Transit → Delivered → Released / Disputed.',
        descriptionHi: 'सभी ऑर्डर एक निश्चित प्रक्रिया से गुजरते हैं: ड्राफ्ट → एस्क्रौ में फंड लॉक → इन ट्रांजिट → डिलीवर्ड → फंड रिलीज़ या विवाद समाधान।'
      },
      {
        stepNumber: 4,
        titleEn: 'Analytics & Reputation Feedback Loop',
        titleHi: 'एनालिटिक्स और प्रतिष्ठा फीडबैक लूप',
        descriptionEn: 'Completed transactions automatically feed into merchant performance analytics, customer loyalty rewards, and tamper-proof reputation widgets.',
        descriptionHi: 'पूर्ण हुए लेनदेन मर्चेंट एनालिटिक्स, कस्टमर लॉयल्टी रिवार्ड्स और ब्लॉकचेन-वेरीफाइड रेटिंग सिस्टम में स्वतः अपडेट हो जाते हैं।'
      }
    ],

    benefitsEn: [
      'Comprehensive multi-channel capabilities: physical goods, digital assets, professional services, and hiring.',
      'Real-time inventory synchronization across multiple warehouses and storefronts.',
      'Automated conversion calculators indexed to global benchmark exchange reference rates.',
      'Built-in CRM with Customer 360 view for tracking purchase history and lifetime value (LTV).',
      'Granular role-based access control (RBAC) for store managers, warehouse staff, and cashiers.'
    ],
    benefitsHi: [
      'मल्टी-चैनल क्षमताएं: भौतिक उत्पाद (Physical Goods), डिजिटल एसेट्स, प्रोफेशनल सर्विसेज और नौकरियां।',
      'विभिन्न वेयरहाउस और स्टोर के बीच रियल-टाइम इन्वेंटरी सिंक (Inventory Sync)।',
      'वैश्विक बेंचमार्क दरों से जुड़े स्वचालित Pi-to-USD कंवर्टर कैलकुलेटर।',
      'कस्टमर 360 व्यू के साथ इन-बिल्ट CRM ताकि खरीदार के इतिहास और लाइफटाइम वैल्यू को ट्रैक किया जा सके।',
      'स्टोर मैनेजर्स और कर्मचारियों के लिए विस्तृत रोल-बेस्ड एक्सेस कंट्रोल (RBAC)।'
    ],

    tipsEn: [
      'Use the Catalog Management tab to organize products into hierarchy groups for faster customer navigation.',
      'Link your storefront to a specific Warehouse ID to ensure localized stock deduction during high-volume sales.',
      'Check the Analytics Dashboard daily to monitor top-selling categories and buyer demographic insights.'
    ],
    tipsHi: [
      'ग्राहकों के लिए नेविगेशन को आसान बनाने हेतु कैटलॉग मैनेजमेंट टैब में उत्पादों को सही श्रेणियों में वर्गीकृत करें।',
      'स्टॉक में गड़बड़ी से बचने के लिए अपने स्टोर को सही वेयरहाउस ID (Warehouse ID) से लिंक करें।',
      'सर्वाधिक बिकने वाले उत्पादों और खरीदार डेटा को ट्रैक करने के लिए रोजाना एनालिटिक्स डैशबोर्ड जांचें।'
    ],

    bestPracticesEn: [
      'Configure automated low-stock alerts in the Inventory Dashboard to prevent out-of-stock cancellations.',
      'Keep store contact information and business registration documents updated to maintain verified badge status.',
      'Respond to buyer inbox messages within 24 hours to maximize store customer response metrics.'
    ],
    bestPracticesHi: [
      'आउट-ऑफ़-स्टॉक स्थिति से बचने के लिए इन्वेंटरी डैशबोर्ड में लो-स्टॉक अलर्ट्स सक्रिय करें।',
      'सत्यापित मर्चेंट बैज बनाए रखने के लिए व्यावसायिक जानकारी और रजिस्ट्रेशन दस्तावेज हमेशा सही रखें।',
      'कस्टमर रिस्पॉन्स रेट बेहतर करने के लिए ग्राहक संदेशों का उत्तर 24 घंटे के भीतर दें।'
    ],

    notesEn: [
      'System Architecture Note: All critical data is saved in cloud-hosted multi-region storage with offline fallback capability.',
      'Security Note: Escrow contracts operate with strict timeout bounds to prevent funds from remaining frozen indefinitely.',
      'Compliance Note: Businesses must adhere to regional commerce guidelines and terms of service.'
    ],
    notesHi: [
      'आर्किटेक्चर नोट: सभी महत्वपूर्ण डेटा मल्टी-रीजन क्लाउड स्टोरेज में सुरक्षित रहते हैं।',
      'सुरक्षा नोट: एस्क्रौ कॉन्ट्रैक्ट्स में टाइम-आउट सीमाएँ होती हैं ताकि फंड कभी बेवजह न फंसे रहें।',
      'अनुपालन नोट: व्यवसायों को अपने स्थानीय ई-कॉमर्स कानूनों का पालन करना आवश्यक है।'
    ],

    faqs: [
      {
        questionEn: 'Can one account manage multiple physical store locations?',
        questionHi: 'क्या एक अकाउंट कई फिजिकल स्टोर लोकेशन मैनेज कर सकता है?',
        answerEn: 'Yes. Pi Business Market supports multi-location store management. You can link multiple warehouses and retail outlets to a single merchant ID.',
        answerHi: 'हाँ! Pi Business Market मल्टी-लोकेशन मैनेजमेंट का समर्थन करता है। आप एक ही मर्चेंट ID से अनेक वेयरहाउस और स्टोर्स लिंक कर सकते हैं।'
      },
      {
        questionEn: 'How does product pricing work in Pi?',
        questionHi: 'Pi में प्रोडक्ट्स की प्राइसिंग कैसे काम करती है?',
        answerEn: 'Merchants set the price in Pi tokens. The platform includes optional conversion indexing that displays approximate fiat equivalents for buyer convenience.',
        answerHi: 'व्यापारी सीधे Pi टोकन में कीमत तय करते हैं। प्लेटफॉर्म में ऑटो-कंवर्टर इंडेक्स भी है जो ग्राहकों की सुविधा के लिए तुलनीय मूल्य दिखाता है।'
      },
      {
        questionEn: 'What happens if an item is out of stock after order placement?',
        questionHi: 'यदि ऑर्डर देने के बाद आइटम आउट-ऑफ़-स्टॉक हो जाए तो क्या होगा?',
        answerEn: 'If an item cannot be fulfilled, the merchant can reject the order draft, which immediately returns the escrowed Pi back to the buyer wallet without penalty.',
        answerHi: 'यदि ऑर्डर पूरा नहीं हो सकता, तो मर्चेंट ऑर्डर रद्द कर सकता है। इससे एस्क्रौ में जमा की गई Pi तुरंत खरीदार के वॉलेट में वापस आ जाती है।'
      },
      {
        questionEn: 'Is there an API available for integrating custom ERP software?',
        questionHi: 'क्या कस्टम ERP सॉफ्टवेयर जोड़ने के लिए API उपलब्ध है?',
        answerEn: 'Yes. Enterprise accounts can access REST and Webhook APIs for inventory sync, order creation, and fulfillment tracking.',
        answerHi: 'हाँ! एंटरप्राइज मर्चेंट्स इन्वेंटरी सिंक और ऑर्डर फुलफिलमेंट के लिए REST API और Webhooks का उपयोग कर सकते हैं।'
      }
    ]
  },

  // ==========================================
  // 3. ABOUT THE PLATFORM - KEY FEATURES
  // ==========================================
  {
    id: 'key-features',
    titleEn: 'Key Features',
    titleHi: 'मुख्य विशेषताएं (Key Features)',
    categoryEn: 'About the Platform',
    categoryHi: 'प्लेटफॉर्म के बारे में',
    badge: 'Capabilities',
    summaryEn: 'Comprehensive breakdown of core modules: Pi Escrow Vault, B2B Wholesale, Multi-Warehouse Inventory, Service Scheduling, Job Portal, and CRM.',
    summaryHi: 'प्लेटफॉर्म के मुख्य मॉड्युल्स: Pi एस्क्रौ वॉल्ट, B2B होलसेल, मल्टी-वेयरहाउस इन्वेंटरी, सर्विस शेड्यूलिंग, जॉब पोर्टल और मर्चेंट CRM।',

    overviewEn: `Pi Business Market brings together six enterprise-grade modules into a cohesive Web3 environment. These features are purpose-built to address the real-world friction of digital commerce, offering seamless token transactions, inventory intelligence, escrow safety, labor allocation, and customer retention tools tailored for the Pi Network ecosystem.`,
    overviewHi: `Pi Business Market छह प्रमुख एंटरप्राइज मॉड्यूल्स को एक शक्तिशाली Web3 वातावरण में जोड़ता है। ये विशेषताएं डिजिटल व्यापार की व्यावहारिक चुनौतियों को हल करती हैं, जैसे टोकन लेनदेन, इन्वेंटरी इंटेलिजेंस, एस्क्रौ सुरक्षा, जॉब भर्ती और कस्टमर रिटेंशन टूल।`,

    purposeEn: `The purpose of Key Features documentation is to provide a detailed guide for users and enterprise merchants on how each specialized module operates, allowing teams to fully leverage advanced capabilities like B2B wholesale pricing, automated fulfillment pipelines, and dispute resolution.`,
    purposeHi: `मुख्य विशेषताओं का उद्देश्य व्यापारियों और उपयोगकर्ताओं को प्लेटफॉर्म के प्रत्येक विशेष मॉड्यूल का पूर्ण उपयोग सिखाना है, जैसे B2B थोक मूल्य निर्धारण, ऑटोमेटेड फुलफिलमेंट और विवाद समाधान।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Smart Escrow Payment Engine',
        titleHi: 'स्मार्ट एस्क्रौ पेमेंट इंजन',
        descriptionEn: 'Locks buyer funds upon checkout. Releases payment automatically upon buyer confirmation or verified shipping delivery proof.',
        descriptionHi: 'चेकआउट पर खरीदार का फंड सुरक्षित रूप से लॉक करता है। सामान मिलने की पुष्टि पर राशि तुरंत विक्रेता को मिल जाती है।'
      },
      {
        stepNumber: 2,
        titleEn: 'Multi-Warehouse & Stock Control',
        titleHi: 'मल्टी-वेयरहाउस और स्टॉक कंट्रोल',
        descriptionEn: 'Track inventory across multiple physical locations, set automated reorder triggers, and generate SKU movement logs.',
        descriptionHi: 'विभिन्न वेयरहाउस में स्टॉक को ट्रैक करें, लो-स्टॉक रीऑर्डर ट्रिगर सेट करें और SKU मूवमेंट लॉग्स प्राप्त करें।'
      },
      {
        stepNumber: 3,
        titleEn: 'B2B Wholesale & Supplier Network',
        titleHi: 'B2B होलसेल और सप्लायर नेटवर्क',
        descriptionEn: 'Connect retail stores directly with primary suppliers for bulk product sourcing paid exclusively in Pi tokens.',
        descriptionHi: 'खुदरा विक्रेताओं को मुख्य सप्लायर्स से जोड़ें ताकि Pi करंसी में थोक खरीद (Bulk Wholesale) की जा सके।'
      },
      {
        stepNumber: 4,
        titleEn: 'Jobs & Service Marketplace',
        titleHi: 'जॉब्स और सर्विस मार्केटप्लेस',
        descriptionEn: 'Post freelance gigs, full-time jobs, or book expert services (electricians, consultants, developers) with Pi milestone payments.',
        descriptionHi: 'फ्रीलांस कार्य, फुल-टाइम नौकरियां पोस्ट करें या Pi माइलस्टोन पेमेंट्स के साथ विशेषज्ञ सेवाएं (Services) बुक करें।'
      }
    ],

    benefitsEn: [
      'Smart Escrow Vault eliminates transaction non-payment and chargeback risks.',
      'B2B Wholesale Portal lowers inventory procurement costs for retail merchants.',
      'Integrated Job Marketplace connects Pi businesses with qualified talent worldwide.',
      'Customer 360 CRM tracks buyer analytics, order history, and custom reward tiers.',
      'Universal Search allows instant discovery of products, services, stores, and job listings.'
    ],
    benefitsHi: [
      'स्मार्ट एस्क्रौ वॉल्ट धोखाधड़ी और पेमेंट चार्जबैक के जोखिम को पूरी तरह समाप्त करता है।',
      'B2B होलसेल पोर्टल खुदरा विक्रेताओं के लिए माल की लागत कम करता है।',
      'एकीकृत जॉब मार्केटप्लेस Pi व्यवसायों को वैश्विक कुशल प्रतिभाओं से जोड़ता है।',
      'कस्टमर 360 CRM खरीदारों के इतिहास और लॉयल्टी रिवार्ड्स को ट्रैक करता है।',
      'यूनिवर्सल सर्च से उत्पाद, सेवाएं, स्टोर और नौकरियां एक क्लिक में खोजी जा सकती हैं।'
    ],

    tipsEn: [
      'Enable Notification Alerts in your account settings to receive real-time updates on escrow milestone releases.',
      'Use the B2B Wholesale section if you run a retail store to buy stock in bulk directly using your Pi revenue.',
      'Employers can set milestone-based Pi escrow payments when hiring freelancers for project-based work.'
    ],
    tipsHi: [
      'एस्क्रौ रिलीज की रियल-टाइम जानकारी के लिए नोटिफिकेशन अलर्ट ऑन रखें।',
      'यदि आप रिटेल स्टोर चलाते हैं, तो अपनी Pi आय का उपयोग करके B2B होलसेल सेक्शन से थोक माल खरीदें।',
      'फ्रीलांस काम पर रखते समय नियोक्ता (Employers) माइलस्टोन-बेस्ड Pi एस्क्रौ पेमेंट्स सेट करें।'
    ],

    bestPracticesEn: [
      'Regularly audit inventory counts in the Warehouse Dashboard to align physical stock with digital listings.',
      'Set clear deliverables and deadlines in service agreements before locking Pi funds into milestone escrow.',
      'Leverage Customer Rewards points to incentivize repeat purchases from your top customers.'
    ],
    bestPracticesHi: [
      'डिजिटल स्टॉक और फिजिकल इन्वेंटरी का सही मिलान रखने के लिए वेयरहाउस डैशबोर्ड का समय-समय पर ऑडिट करें।',
      'एस्क्रौ में फंड लॉक करने से पहले सर्विस कॉन्ट्रैक्ट में काम की शर्तें और समय-सीमा स्पष्ट तय करें।',
      'ग्राहकों को दोबारा खरीदारी के लिए प्रोत्साहित करने हेतु लॉयल्टी रिवार्ड्स प्वाइंट्स का उपयोग करें।'
    ],

    notesEn: [
      'Escrow Rules: If a dispute is raised, funds remain securely held in escrow until resolved by community arbitration.',
      'Job Marketplace Note: Milestone payments are held in escrow and released progressively as deliverables are approved.',
      'System Limits: Bulk product uploads support up to 10,000 SKUs per catalog file.'
    ],
    notesHi: [
      'एस्क्रौ नियम: विवाद होने की स्थिति में मध्यस्थता (Arbitration) पूरी होने तक फंड एस्क्रौ में सुरक्षित रहता है।',
      'जॉब मार्केटप्लेस नोट: कार्य के अलग-अलग चरण पूरे होने पर माइलस्टोन भुगतान जारी किया जाता है।',
      'सिस्टम सीमाएं: कैटलॉग फाइल में एक बार में 10,000 SKUs तक अपलोड किए जा सकते हैं।'
    ],

    faqs: [
      {
        questionEn: 'How does the Smart Escrow Vault protect buyers?',
        questionHi: 'स्मार्ट एस्क्रौ वॉल्ट खरीदारों की सुरक्षा कैसे करता है?',
        answerEn: 'When you purchase an item, your Pi is transferred to an escrow vault—not directly to the seller. The seller only receives funds after you verify item delivery.',
        answerHi: 'जब आप खरीदारी करते हैं, तो आपकी Pi सीधे विक्रेता को नहीं जाती, बल्कि एस्क्रौ में लॉक होती है। आपके द्वारा डिलीवरी स्वीकार करने पर ही राशि विक्रेता को मिलती है।'
      },
      {
        questionEn: 'Can I offer services (e.g. consulting or home repairs) for Pi?',
        questionHi: 'क्या मैं Pi के बदले अपनी सेवाएं (जैसे कंसल्टिंग या मरम्मत) दे सकता हूं?',
        answerEn: 'Yes! Navigate to Service Management to list your skills, set hourly or project rates in Pi, and receive direct client bookings.',
        answerHi: 'हाँ! सर्विस मैनेजमेंट पर जाकर अपनी कुशलताओं को सूचीबद्ध करें, Pi में दरें तय करें और सीधे क्लाइंट बुकिंग प्राप्त करें।'
      },
      {
        questionEn: 'How does B2B Wholesale help small store owners?',
        questionHi: 'B2B होलसेल छोटे दुकानदारों की मदद कैसे करता है?',
        answerEn: 'Small store owners can use Pi earned from retail sales to buy inventory directly from wholesale manufacturers at discounted prices without converting to fiat.',
        answerHi: 'छोटे मर्चेंट अपनी रिटेल बिक्री से कमाई गई Pi से सीधे थोक निर्माताओं से कम कीमत पर सामान खरीद सकते हैं, बिना किसी मुद्रा परिवर्तन के।'
      },
      {
        questionEn: 'What is the Customer 360 CRM tool?',
        questionHi: 'कस्टमर 360 CRM टूल क्या है?',
        answerEn: 'Customer 360 gives merchants a unified view of each buyer’s purchase history, total Pi spent, feedback ratings, and custom discount tier eligibility.',
        answerHi: 'कस्टमर 360 मर्चेंट को ग्राहक की खरीदारी का पूरा इतिहास, कुल खर्च की गई Pi, रेटिंग्स और डिस्काउंट एलिजिबिलिटी का संपूर्ण विवरण दिखाता है।'
      }
    ]
  },

  // ==========================================
  // 4. ABOUT THE PLATFORM - BENEFITS
  // ==========================================
  {
    id: 'benefits',
    titleEn: 'Benefits of Pi Business Market',
    titleHi: 'Pi Business Market के लाभ (Platform Benefits)',
    categoryEn: 'About the Platform',
    categoryHi: 'प्लेटफॉर्म के बारे में',
    badge: 'Value Proposition',
    summaryEn: 'An exhaustive analysis of tangible commercial, financial, and operational benefits for merchants, buyers, enterprises, and logistics providers.',
    summaryHi: 'व्यापारियों, खरीदारों, उद्यमों और लॉजिस्टिक्स पार्टनर्स के लिए व्यावहारिक, वित्तीय और परिचालन संबंधी लाभों का पूर्ण विश्लेषण।',

    overviewEn: `Pi Business Market transforms how digital commerce is conducted by leveraging decentralized Web3 architecture. By substituting legacy payment rails with instant Pi cryptocurrency settlements and Smart Escrow automation, the platform reduces operational overhead by up to 90%, eliminates credit card processing fees, eradicates international remittance friction, and provides a trustless trading environment for millions of Pioneers globally.`,
    overviewHi: `Pi Business Market ब्लॉकचेन तकनीक के माध्यम से डिजिटल व्यापार को क्रांतिकारी रूप देता है। पारंपरिक बैंकिंग क्रेडिट कार्ड फीस को समाप्त करके और एस्क्रौ ऑटोमेशन लागू करके, यह प्लेटफॉर्म परिचालन लागत को 90% तक घटाता है, अंतर्राष्ट्रीय भुगतानों को आसान बनाता है और करोड़ों Pioneers को एक सुरक्षित ट्रेडिंग वातावरण प्रदान करता है।`,

    purposeEn: `The purpose of the Benefits section is to quantify and explain the strategic advantages gained by adopting Pi Business Market over conventional e-commerce platforms like Amazon, Shopify, or eBay, highlighting cost savings, global market access, and cryptographic security.`,
    purposeHi: `लाभ खंड का उद्देश्य पारम्परिक ई-कॉमर्स प्लेटफॉर्मों की तुलना में Pi Business Market अपनाने से मिलने वाले व्यावसायिक फायदों को स्पष्ट करना है, जिसमें लागत में बचत, वैश्विक ग्राहक पहुंच और सुरक्षा शामिल है।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Elimination of Credit Card Processing Fees',
        titleHi: 'क्रेडिट कार्ड प्रोसेसिंग फीस का खात्मा',
        descriptionEn: 'Traditional gateways charge 2.9% + $0.30 per transaction. Pi Business Market transactions carry zero merchant processing surcharges.',
        descriptionHi: 'पारंपरिक पेमेंट गेटवे 2.9% तक शुल्क लेते हैं। Pi Business Market में व्यापारियों से कोई मर्चेंट कटिंग फीस नहीं ली जाती।'
      },
      {
        stepNumber: 2,
        titleEn: 'Instant Frictionless Global Remittance',
        titleHi: 'त्वरित एवं बाधा-रहित वैश्विक भुगतान',
        descriptionEn: 'Cross-border sales settle instantly in Pi without multi-day banking delays, currency conversion spread losses, or SWIFT wire fees.',
        descriptionHi: 'अंतर्राष्ट्रीय बिक्री बिना किसी बैंकिंग देरी, मुद्रा परिवर्तन नुकसान या वायर ट्रांसफ़र फीस के तुरंत Pi में सेटल होती है।'
      },
      {
        stepNumber: 3,
        titleEn: 'Guaranteed Fraud & Chargeback Protection',
        titleHi: 'धोखाधड़ी और चार्जबैक से पूर्ण सुरक्षा',
        descriptionEn: 'Smart Escrow eliminates fraudulent chargebacks. Funds cannot be forcibly clawed back after buyer delivery confirmation.',
        descriptionHi: 'स्मार्ट एस्क्रौ फर्जी चार्जबैक की संभावना खत्म करता है। सामान प्राप्त होने के बाद कोई भी फंड जबरन वापस नहीं खींच सकता।'
      },
      {
        stepNumber: 4,
        titleEn: 'Direct Ecosystem Utility Monetization',
        titleHi: 'इकोसिस्टम में Pi का सीधा व्यावहारिक उपयोग',
        descriptionEn: 'Pioneers can spend mined Pi tokens directly on real products, services, and wholesale goods without fiat liquidation hurdles.',
        descriptionHi: 'Pioneers अपनी माइन की गई Pi को सीधे वास्तविक उत्पादों, सेवाओं और थोक माल पर खर्च कर सकते हैं।'
      }
    ],

    benefitsEn: [
      'For Merchants: Zero card processing fees, instant global liquidity, and built-in access to millions of Pi holders.',
      'For Buyers: Fraud-proof escrow shopping, verified merchant badges, and zero hidden foreign transaction fees.',
      'For Enterprises: Multi-warehouse stock tracking, B2B wholesale pipelines, and automated staff permissions.',
      'For Freelancers & Job Seekers: Guaranteed milestone payouts locked in escrow before work begins.',
      'For Ecosystem: Drives real-world velocity and utility for the Pi cryptocurrency.'
    ],
    benefitsHi: [
      'व्यापारियों के लिए: शून्य प्रोसेसिंग शुल्क, त्वरित वैश्विक लिक्विडिटी और लाखों Pi धारकों तक सीधी पहुंच।',
      'खरीदारों के लिए: एस्क्रौ-सुरक्षित खरीदारी, सत्यापित मर्चेंट बैज और कोई छिपा हुआ शुल्क नहीं।',
      'उद्यमों के लिए: मल्टी-वेयरहाउस इन्वेंटरी ट्रैकिंग, B2B थोक सप्लाई चेन और ऑटोमेटेड एक्सेस।',
      'फ्रीलांसर्स के लिए: काम शुरू होने से पहले ही एस्क्रौ में सुरक्षित माइलस्टोन भुगतान।',
      'इकोसिस्टम के लिए: Pi क्रिप्टोकरंसी के वास्तविक उपयोग और लिक्विडिटी में भारी वृद्धि।'
    ],

    tipsEn: [
      'Highlight "Zero Processing Fee" in your merchant advertising to attract budget-conscious buyers.',
      'Use the customer loyalty rewards program to convert one-time buyers into recurring brand advocates.',
      'Integrate your warehouse network to offer faster localized shipping options to nearby customers.'
    ],
    tipsHi: [
      'बजट के प्रति जागरूक ग्राहकों को आकर्षित करने के लिए अपने विज्ञापनों में "Zero Processing Fee" को हाइलाइट करें।',
      'एक बार खरीदारी करने वाले ग्राहकों को नियमित खरीदार बनाने के लिए लॉयल्टी रिवार्ड्स प्रोग्राम का उपयोग करें।',
      'पास के ग्राहकों को तेज़ डिलीवरी देने के लिए अपने नजदीकी वेयरहाउस नेटवर्क को जोड़ें।'
    ],

    bestPracticesEn: [
      'Reinvest Pi earned from retail sales into B2B wholesale procurement to build a closed-loop business cycle.',
      'Regularly review Customer 360 metrics to identify high-value VIP buyers and offer tailored discounts.',
      'Maintain transparent shipping tracking to accelerate buyer escrow release times.'
    ],
    bestPracticesHi: [
      'रिटेल बिक्री से कमाई गई Pi को थोक माल खरीदने में लगाकर क्लोज्ड-लूप बिज़नेस मॉडल बनाएं।',
      'VIP खरीदारों की पहचान करने और उन्हें विशेष छूट देने के लिए कस्टमर 360 मेट्रिक्स की जांच करें।',
      'एस्क्रौ रिलीज़ में तेजी लाने के लिए हमेशा पारदर्शी शिपिंग ट्रैकिंग जानकारी प्रदान करें।'
    ],

    notesEn: [
      'Financial Note: All platform pricing is transparently indexed for accounting and audit compliance.',
      'Security Note: Escrow funds are secured in non-custodial cryptographic smart contracts.',
      'Performance Note: Transactions complete within seconds on the high-throughput Pi blockchain network.'
    ],
    notesHi: [
      'वित्तीय नोट: ऑडिटिंग और टैक्स कम्प्लायंस की सुविधा के लिए सभी कीमतें पारदर्शी रूप से दर्ज होती हैं।',
      'सुरक्षा नोट: एस्क्रौ में रखी गई राशियाँ सुरक्षित स्मार्ट कॉन्ट्रैक्ट्स में संग्रहीत होती हैं।',
      'परफॉरमेंस नोट: Pi नेटवर्क पर सभी लेनदेन कुछ ही सेकंड में पूरे होते हैं।'
    ],

    faqs: [
      {
        questionEn: 'Why is Pi Business Market cheaper than traditional e-commerce platforms?',
        questionHi: 'Pi Business Market पारंपरिक ई-कॉमर्स प्लेटफॉर्मों से सस्ता क्यों है?',
        answerEn: 'Because it runs on peer-to-peer blockchain technology, removing credit card intermediaries, bank wire surcharges, and costly payment gateway fees.',
        answerHi: 'क्योंकि यह पीयर-टू-पीयर ब्लॉकचेन तकनीक पर चलता है, जो बिचौलिया बैंकों, कार्ड कंपनियों और पेमेंट गेटवे शुल्कों को हटा देता है।'
      },
      {
        questionEn: 'How does escrow benefit cross-border transactions?',
        questionHi: 'एस्क्रौ से अंतर्राष्ट्रीय लेनदेन में क्या फायदा होता है?',
        answerEn: 'It eliminates trust barriers between buyers and sellers in different countries. The buyer knows their money is safe, and the seller knows payment is guaranteed upon delivery.',
        answerHi: 'यह विभिन्न देशों के खरीदारों और विक्रेताओं के बीच अविश्वास की दीवार को खत्म करता है। दोनों पक्षों को भुगतान और डिलीवरी की गारंटी मिलती है।'
      },
      {
        questionEn: 'Can I withdraw or use my Pi earnings immediately?',
        questionHi: 'क्या मैं अपनी Pi कमाई का तुरंत उपयोग कर सकता हूं?',
        answerEn: 'Yes! Once released from escrow, Pi funds are immediately available in your wallet for B2B wholesale purchases, service bookings, or merchant transfers.',
        answerHi: 'हाँ! एस्क्रौ से रिलीज़ होते ही आपकी Pi आपके वॉलेट में आ जाती है, जिससे आप तुरंत B2B सामान या सेवाएं खरीद सकते हैं।'
      },
      {
        questionEn: 'Do buyers have to pay foreign exchange transaction fees?',
        questionHi: 'क्या खरीदारों को कोई विदेशी मुद्रा परिवर्तन शुल्क देना होता है?',
        answerEn: 'No. Because Pi is a global native digital currency, cross-border payments incur zero foreign exchange conversion or bank markups.',
        answerHi: 'नहीं! क्योंकि Pi एक वैश्विक डिजिटल करंसी है, इसलिए कोई भी विदेशी मुद्रा कंवर्जन शुल्क या बैंक चार्ज नहीं लगता।'
      }
    ]
  },

  // ==========================================
  // 5. ABOUT THE PLATFORM - WHO CAN USE IT
  // ==========================================
  {
    id: 'who-can-use',
    titleEn: 'Who Can Use Pi Business Market',
    titleHi: 'कौन इस्तेमाल कर सकता है (Who Can Use Pi Business Market)',
    categoryEn: 'About the Platform',
    categoryHi: 'प्लेटफॉर्म के बारे में',
    badge: 'Audience Roles',
    summaryEn: 'Detailed guide to operational roles: Buyers (Pioneers), Store Merchants, B2B Wholesalers, Logistics Partners, Service Providers, and Employers.',
    summaryHi: 'विभिन्न उपयोगकर्ता भूमिकाओं का विस्तृत विवरण: खरीदार (Pioneers), स्टोर मर्चेंट्स, B2B थोक व्यापारी, वेयरहाउस पार्टनर्स, सर्विस प्रदाता और नियोक्ता।',

    overviewEn: `Pi Business Market is engineered as an inclusive ecosystem designed to serve six primary user personas across the global economy. Whether you are an individual Pioneer looking to buy daily goods with mined Pi, a brick-and-mortar store owner, a regional warehouse operator, an independent contractor, or an enterprise employer, the platform offers tailored interface views, permission systems, and toolsets for your specific operational role.`,
    overviewHi: `Pi Business Market को इस प्रकार डिज़ाइन किया गया है कि यह छह प्रमुख उपयोगकर्ता श्रेणियों की आवश्यकताओं को पूरा करता है। चाहे आप सामान्य ग्राहक हों, खुदरा दुकानदार हों, वेयरहाउस ऑपरेटर हों, फ्रीलांसर हों या बड़े एंटरप्राइज नियोक्ता हों, प्लेटफॉर्म प्रत्येक भूमिका के लिए विशेष टूल्स और डैशबोर्ड प्रदान करता है।`,

    purposeEn: `The purpose of this section is to help users identify their operational persona, understand the prerequisites for each role, and quickly navigate to the appropriate tools and dashboard views within the platform.`,
    purposeHi: `इस खंड का उद्देश्य उपयोगकर्ताओं को उनकी सही भूमिका (Role) पहचानने, आवश्यक शर्तों को समझने और उनके उपयोग हेतु उपयुक्त डैशबोर्ड का चयन करने में सहायता करना है।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Pioneers & Retail Buyers',
        titleHi: 'Pioneers और खुदरा खरीदार (Buyers)',
        descriptionEn: 'Browse products, order services, pay securely via Smart Escrow, track package fulfillment, earn loyalty rewards, and review merchants.',
        descriptionHi: 'सामान खरीदें, सेवाएं बुक करें, एस्क्रौ द्वारा सुरक्षित भुगतान करें, पैकेज ट्रैकिंग देखें और रिव्यू दें।'
      },
      {
        stepNumber: 2,
        titleEn: 'Store Merchants & Retailers',
        titleHi: 'स्टोर मर्चेंट्स और खुदरा विक्रेता',
        descriptionEn: 'Manage product catalogs, create branded storefronts, set Pi pricing, fulfill customer orders, track sales analytics, and manage CRM profiles.',
        descriptionHi: 'कैटलॉग बनाएं, Pi में मूल्य तय करें, ग्राहक ऑर्डर पूरे करें, बिक्री एनालिटिक्स और CRM प्रोफाइल मैनेज करें।'
      },
      {
        stepNumber: 3,
        titleEn: 'B2B Wholesalers & Manufacturers',
        titleHi: 'B2B थोक विक्रेता और निर्माता',
        descriptionEn: 'Sell bulk inventory directly to retail store owners in wholesale quantities with volume discounts and direct B2B settlement in Pi.',
        descriptionHi: 'खुदरा दुकानदारों को थोक में सामान बेचें, वॉल्यूम डिस्काउंट प्रदान करें और सीधे B2B Pi भुगतान प्राप्त करें।'
      },
      {
        stepNumber: 4,
        titleEn: 'Warehouse & Fulfillment Operators',
        titleHi: 'वेयरहाउस और फुलफिलमेंट पार्टनर्स',
        descriptionEn: 'Store physical inventory, manage stock inbound/outbound movements, handle order pick-pack-ship workflows, and generate waybills.',
        descriptionHi: 'फिजिकल माल स्टोर करें, इनबाउंड/आउटबाउंड स्टॉक प्रबंधित करें, पिक-पैक-शिप प्रक्रिया चलाएं और वेबिल जेनरेट करें।'
      }
    ],

    benefitsEn: [
      'Tailored Dashboard Layouts optimized for each user role.',
      'Role-Based Access Control (RBAC) preventing unauthorized access to sensitive company data.',
      'Seamless multi-role switching (e.g. a Merchant can also act as an Employer or Buyer from one account).',
      'Verified Badge Progression (Unverified → Verified Pioneer → KYC Business Merchant → Enterprise Partner).',
      'Unified Identity across Web3, Mobile Pi Browser, and API integrations.'
    ],
    benefitsHi: [
      'प्रत्येक भूमिका के लिए विशेष रूप से ऑप्टिमाइज्ड इंटरफेस और डैशबोर्ड।',
      'संवेदनशील डेटा की सुरक्षा के लिए रोल-बेस्ड एक्सेस कंट्रोल (RBAC)।',
      'एक ही अकाउंट से आसानी से रोल बदलने की सुविधा (जैसे मर्चेंट खरीदार या नियोक्ता भी बन सकता है)।',
      'सत्यापन बैज प्रगति (Unverified → Verified Pioneer → KYC Merchant → Enterprise Partner)।',
      'Web3, मोबाइल और API में एक ही सुरक्षित डिजिटल पहचान।'
    ],

    tipsEn: [
      'Complete KYC verification early to unlock higher account transaction limits and obtain the Verified Business badge.',
      'If you operate both a physical store and a warehouse, link them under the same Business Account to streamline inventory deduction.',
      'Employers should clearly specify job descriptions and deliverables to ensure quick candidate matching.'
    ],
    tipsHi: [
      'उच्च लेनदेन सीमा और सत्यापित बिज़नेस बैज पाने के लिए जल्द से जल्द KYC वेरिफिकेशन पूरा करें।',
      'यदि आपके पास स्टोर और वेयरहाउस दोनों हैं, तो इन्वेंटरी सिंक बनाए रखने के लिए उन्हें एक ही बिज़नेस प्रोफाइल से जोड़ें।',
      'योग्य उम्मीदवारों को जल्दी आकर्षित करने के लिए नियोक्ता नौकरियों का स्पष्ट विवरण दें।'
    ],

    bestPracticesEn: [
      'Store Managers should assign restricted sub-accounts to staff members instead of sharing primary login credentials.',
      'Service Providers should maintain updated calendars to prevent booking overlaps and scheduling conflicts.',
      'Wholesalers should set clear Minimum Order Quantity (MOQ) thresholds on bulk product listings.'
    ],
    bestPracticesHi: [
      'स्टोर मालिक कर्मचारियों को मुख्य पासवर्ड देने के बजाय सीमित अधिकारों वाले सब-अकाउंट्स (Sub-accounts) दें।',
      'सर्विस प्रदाता बुकिंग में टकराव से बचने के लिए अपना कैलेंडर हमेशा अपडेट रखें।',
      'थोक विक्रेता अपनी B2B लिस्टिंग में न्यूनतम ऑर्डर मात्रा (MOQ) स्पष्ट रूप से दर्ज करें।'
    ],

    notesEn: [
      'Identity Note: One Pi account can hold multiple operational sub-roles safely.',
      'Verification Note: KYC checks are conducted via secure, privacy-preserving zero-knowledge protocols.',
      'Access Note: Admin Console controls are strictly reserved for verified platform administrators.'
    ],
    notesHi: [
      'पहचान नोट: एक ही Pi अकाउंट से सुरक्षित रूप से विभिन्न भूमिकाएं निभाई जा सकती हैं।',
      'सत्यापन नोट: KYC वेरिफिकेशन गोपनीयता-सुरक्षित जीरो-नॉलेज प्रोटोकॉल द्वारा किया जाता है।',
      'एक्सेस नोट: एडमिन कंसोल नियंत्रण केवल अधिकृत प्लेटफॉर्म एडमिन्स के लिए सुरक्षित हैं।'
    ],

    faqs: [
      {
        questionEn: 'Can an individual Pioneer sell items on Pi Business Market without registering a company?',
        questionHi: 'क्या एक व्यक्तिगत Pioneer बिना कंपनी रजिस्टर किए सामान बेच सकता है?',
        answerEn: 'Yes! Individual Pioneers can create individual merchant profiles to sell pre-owned items, handmade crafts, or localized services.',
        answerHi: 'हाँ! व्यक्तिगत Pioneers अपने इस्तेमाल किए सामान, हस्तशिल्प या स्थानीय सेवाएं बेचने के लिए इंडिविजुअल मर्चेंट प्रोफाइल बना सकते हैं।'
      },
      {
        questionEn: 'What is required to become a Warehouse Fulfillment Partner?',
        questionHi: 'वेयरहाउस फुलफिलमेंट पार्टनर बनने के लिए क्या आवश्यक है?',
        answerEn: 'Warehouse operators must submit physical facility proof, location coordinates, storage capacity metrics, and complete Business KYC.',
        answerHi: 'वेयरहाउस ऑपरेटरों को फिजिकल स्टोरेज सुविधा की जानकारी, लोकेशन और बिज़नेस KYC दस्तावेज जमा करना होता है।'
      },
      {
        questionEn: 'How do Service Providers receive payment for their work?',
        questionHi: 'सर्विस प्रदाताओं को उनके काम का भुगतान कैसे मिलता है?',
        answerEn: 'Clients prepay into Escrow upon booking. Once the service is delivered and confirmed, funds release automatically to the Service Provider’s wallet.',
        answerHi: 'क्लाइंट बुकिंग के समय एस्क्रौ में एडवांस पेमेंट जमा करते हैं। सेवा पूरी होने और पुष्टि मिलने के बाद राशि प्रदाता को मिल जाती है।'
      },
      {
        questionEn: 'Is there an age limit or geographic restriction for using the platform?',
        questionHi: 'क्या प्लेटफॉर्म का उपयोग करने के लिए कोई आयु या भौगोलिक सीमा है?',
        answerEn: 'Pi Business Market is available globally to all Pi Network account holders in compliance with Pi Network’s Terms of Service and local regulations.',
        answerHi: 'Pi Business Market Pi नेटवर्क के नियमों और स्थानीय कानूनों के अनुपालन में दुनिया भर के सभी उपयोगकर्ताओं के लिए उपलब्ध है।'
      }
    ]
  },

  // ==========================================
  // 6. ABOUT THE PLATFORM - WHY PI BUSINESS MARKET
  // ==========================================
  {
    id: 'why-pi-business-market',
    titleEn: 'Why Pi Business Market',
    titleHi: 'क्यों इस्तेमाल करें Pi Business Market (Why Pi Business Market)',
    categoryEn: 'About the Platform',
    categoryHi: 'प्लेटफॉर्म के बारे में',
    badge: 'Competitive Analysis',
    summaryEn: 'Strategic justification, market necessity, and technical superiority of Pi Business Market over legacy e-commerce and centralized crypto exchanges.',
    summaryHi: 'पारंपरिक ई-कॉमर्स और सेंट्रलाइज्ड क्रिप्टो एक्सचेंजों की तुलना में Pi Business Market की तकनीकी और रणनीतिक श्रेष्ठता।',

    overviewEn: `While centralized e-commerce giants (Amazon, eBay) impose heavy listing fees, retain control over merchant customer data, and restrict cross-border payout rails, and traditional crypto platforms treat tokens merely as speculative assets, Pi Business Market creates a true circular utility economy. It allows Pi Network’s 55+ million Pioneers to spend their cryptocurrency directly on real economic value, giving merchants instant access to a massive global audience with zero credit card fees and zero payment dispute risk.`,
    overviewHi: `जहां अमेज़न और ई-बे जैसे सेंट्रलाइज्ड प्लेटफॉर्म भारी फीस लेते हैं, मर्चेंट डेटा पर कब्जा रखते हैं और अंतर्राष्ट्रीय भुगतानों को सीमित करते हैं, वहीं Pi Business Market एक वास्तविक सर्कुलर इकोनामी (Circular Utility Economy) का निर्माण करता है। यह Pi नेटवर्क के 5.5 करोड़ से अधिक उपयोगकर्ताओं को वास्तविक वस्तुओं पर अपनी क्रिप्टो खर्च करने की सीधी सुविधा देता है।`,

    purposeEn: `The purpose of Why Pi Business Market is to present a clear, data-driven comparison demonstrating why merchants and consumers should migrate their primary commerce operations to Pi Business Market rather than remaining trapped in fee-heavy Web2 platforms or speculative crypto trading apps.`,
    purposeHi: `इस खंड का मुख्य उद्देश्य डेटा-संचालित तुलना द्वारा यह साबित करना है कि क्यों व्यापारियों और ग्राहकों को महंगे Web2 प्लेटफॉर्म छोड़कर Pi Business Market पर आना चाहिए।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Direct Ecosystem Monetization',
        titleHi: 'इकोसिस्टम का प्रत्यक्ष मुद्रीकरण',
        descriptionEn: 'Connects mined digital assets directly to tangible real-world commerce without passing through high-fee fiat crypto brokerages.',
        descriptionHi: 'माइन की गई डिजिटल एसेट्स को सीधे वास्तविक कॉमर्स से जोड़ता है, जिससे महँगे क्रिप्टो-टू-फिएट एक्सचेंजों की आवश्यकता खत्म हो जाती है।'
      },
      {
        stepNumber: 2,
        titleEn: 'Data Ownership & Privacy Protection',
        titleHi: 'डेटा स्वामित्व और गोपनीयता',
        descriptionEn: 'Merchants retain full ownership of customer relationships via Customer 360 CRM without platform data extraction or ad manipulation.',
        descriptionHi: 'व्यापारी किसी भी बिचौलिया विज्ञापनदाता के हस्तक्षेप के बिना अपने ग्राहकों के डेटा पर पूर्ण स्वामित्व रखते हैं।'
      },
      {
        stepNumber: 3,
        titleEn: 'Cryptographic Escrow Security',
        titleHi: 'क्रिप्टोग्राफिक एस्क्रौ सुरक्षा',
        descriptionEn: 'Replaces legacy manual chargeback claim departments with automated, code-enforced smart escrow contracts.',
        descriptionHi: 'पारंपरिक विवाद प्रक्रियाओं की जगह कोड द्वारा स्वचालित रूप से संचालित होने वाले स्मार्ट एस्क्रौ का उपयोग करता है।'
      },
      {
        stepNumber: 4,
        titleEn: 'Decentralized High Scalability',
        titleHi: 'विकेंद्रीकृत उच्च स्केलेबिलिटी',
        descriptionEn: 'Leverages high-speed cloud containerization paired with Pi Network’s fast block finality for instant scaling under heavy flash-sale traffic.',
        descriptionHi: 'अत्यधिक बिक्री ट्रैफ़िक के दौरान भी तेज़ गति और उच्च स्केलेबिलिटी प्रदान करता है।'
      }
    ],

    benefitsEn: [
      'Eliminates 3-5% payment processing and platform transaction taxes.',
      'Provides immediate access to 55+ million active global Pi Network Pioneers.',
      'Complete immunity against fraudulent credit card chargebacks and identity theft.',
      'Integrated B2B wholesale loop allows merchants to restock inventory using Pi revenue.',
      'Enterprise-grade security with multi-region backup and 99.99% uptime SLA.'
    ],
    benefitsHi: [
      '3-5% पेमेंट कटिंग और प्लेटफॉर्म ट्रांजैक्शन टैक्स को पूरी तरह समाप्त करता है।',
      'विश्व भर के 5.5 करोड़ से अधिक सक्रिय Pi Pioneers तक सीधी पहुँच।',
      'क्रेडिट कार्ड धोखाधड़ी और फर्जी चार्जबैक दावों से 100% सुरक्षा।',
      'अपनी Pi कमाई से सीधे थोक माल खरीदने की B2B होलसेल सुविधा।',
      '99.99% अपटाइम के साथ एंटरप्राइज-स्तरीय मल्टी-रीजन क्लाउड सुरक्षा।'
    ],

    tipsEn: [
      'Share your Pi Business Market store link directly on Pi Network social channels to capture high-intent Pioneer traffic.',
      'Offer small Pi discounts for buyers who complete reviews to quickly build top-tier merchant trust scores.',
      'Use the Universal Search feature to monitor competitor pricing and adjust your catalog strategically.'
    ],
    tipsHi: [
      'Pioneer ग्राहकों को आकर्षित करने के लिए अपने स्टोर का लिंक सीधे सामाजिक चैनलों पर साझा करें।',
      'जल्दी रेटिंग्स और रिव्यू पाने के लिए समीक्षा करने वाले खरीदारों को विशेष डिस्काउंट दें।',
      'प्रतिस्पर्धी मूल्य निर्धारण की निगरानी के लिए यूनिवर्सल सर्च (Universal Search) का उपयोग करें।'
    ],

    bestPracticesEn: [
      'Promote your store as a "Native Pi Accepted Business" to gain priority indexing in search discovery.',
      'Keep product stock quantities accurate in real-time to maintain a 100% order fulfillment rate.',
      'Leverage integrated logistics tracking to give buyers full visibility into shipping progress.'
    ],
    bestPracticesHi: [
      'सर्च परिणाम में प्राथमिकता पाने के लिए अपने स्टोर को "Native Pi Accepted Business" के रूप में प्रमोट करें।',
      '100% ऑर्डर डिलीवरी रेट बनाए रखने के लिए स्टॉक की मात्रा हमेशा सही रखें।',
      'खरीदारों का विश्वास जीतने के लिए पारदर्शी शिपिंग और डिलीवरी ट्रैकिंग प्रदान करें।'
    ],

    notesEn: [
      'Market Comparison: Traditional e-commerce platforms take 10-20% cut per sale; Pi Business Market charges zero seller commissions.',
      'Security Guarantee: Smart Escrow ensures funds are never released without physical or verified digital delivery.',
      'Global Reach: Operate seamlessly in over 180+ countries with native multi-currency index reference support.'
    ],
    notesHi: [
      'मार्केट तुलना: पारंपरिक प्लेटफॉर्म 10-20% तक कमीशन काटते हैं; Pi Business Market विक्रेताओं से शून्य कमीशन लेता है।',
      'सुरक्षा गारंटी: डिलीवरी की पुष्टि के बिना एस्क्रौ से फंड कभी रिलीज नहीं होता।',
      'वैश्विक पहुंच: 180 से अधिक देशों में आसानी से व्यापार संचालन करें।'
    ],

    faqs: [
      {
        questionEn: 'How does Pi Business Market compare to Amazon or eBay?',
        questionHi: 'Pi Business Market की अमेज़न या ई-बे से क्या तुलना है?',
        answerEn: 'Unlike Amazon or eBay which charge up to 15% commission and credit card processing fees, Pi Business Market charges zero seller commission and uses fast, fee-free Pi crypto payments.',
        answerHi: 'अमेज़न/ई-बे जहाँ 15% तक कमीशन और कार्ड प्रोसेसिंग शुल्क लेते हैं, वहीं Pi Business Market विक्रेताओं से 0% कमीशन लेता है और तेज़ Pi पेमेंट्स का उपयोग करता है।'
      },
      {
        questionEn: 'Why should I accept Pi instead of traditional fiat money?',
        questionHi: 'मुझे पारंपरिक फिएट मुद्रा की बजाय Pi क्यों स्वीकार करनी चाहिए?',
        answerEn: 'Accepting Pi opens your business to a global community of 55+ million active Pioneers eager to spend their balance on real goods, giving you instant international customer reach.',
        answerHi: 'Pi स्वीकार करने से आपका व्यवसाय 5.5 करोड़ से अधिक उत्साही ग्राहकों के वैश्विक नेटवर्क से सीधे जुड़ जाता है, जो अपना बैलेंस खर्च करना चाहते हैं।'
      },
      {
        questionEn: 'Are merchant ratings and customer reviews tamper-proof?',
        questionHi: 'क्या मर्चेंट रेटिंग्स और कस्टमर रिव्यूज़ सुरक्षित और अपरिवर्तनीय हैं?',
        answerEn: 'Yes. Reviews can only be submitted after a verified, completed escrow transaction, preventing fake competitor reviews or review-bombing.',
        answerHi: 'हाँ! केवल वे ही ग्राहक समीक्षा दे सकते हैं जिन्होंने वास्तव में ऑर्डर पूरा किया है। इससे फर्जी रिव्यू की संभावना खत्म हो जाती है।'
      },
      {
        questionEn: 'Is Pi Business Market fully compliant with Pi Network policies?',
        questionHi: 'क्या Pi Business Market Pi नेटवर्क की नीतियों के पूर्ण अनुकूल है?',
        answerEn: 'Yes. The platform strictly adheres to Pi Network App Platform Guidelines, utilizing official SDK authentication and ecosystem security protocols.',
        answerHi: 'हाँ! प्लेटफॉर्म Pi Network App Platform दिशानिर्देशों और आधिकारिक SDK सुरक्षा प्रोटोकॉल का पूर्णतः पालन करता है।'
      }
    ]
  },

  // ==========================================
  // 7. HOW THE PLATFORM WORKS
  // ==========================================
  {
    id: 'how-the-platform-works',
    titleEn: 'How the Platform Works',
    titleHi: 'प्लेटफॉर्म कैसे काम करता है (How the Platform Works)',
    categoryEn: 'How the Platform Works',
    categoryHi: 'प्लेटफॉर्म कैसे काम करता है',
    badge: 'Workflow Guide',
    summaryEn: 'Step-by-step technical and operational walkthrough of the end-to-end commerce lifecycle on Pi Business Market.',
    summaryHi: 'Pi Business Market पर शुरुआत से अंत तक व्यापार प्रक्रिया का चरण-दर-चरण विस्तृत तकनीकी और व्यावहारिक मार्गदर्शिका।',

    overviewEn: `The operational lifecycle of Pi Business Market is designed around simplicity, cryptographic transparency, and speed. From the moment a buyer logs into the platform via the Pi Browser to order fulfillment, dispute management, and revenue settlement, every interaction follows a deterministic workflow. This section outlines the step-by-step operational pipeline connecting buyers, merchants, warehouses, and the underlying Pi blockchain escrow vault.`,
    overviewHi: `Pi Business Market का कार्यप्रवाह सरलता, पारदर्शिता और उच्च गति पर आधारित है। Pi Browser में लॉगिन करने से लेकर मर्चेंट कैटलॉग ब्राउज़ करने, एस्क्रौ भुगतान लॉक करने, वेयरहाउस पिक-पैक-शिप और फंड रिलीज़ तक—हर चरण एक पूर्व-निर्धारित स्वचालित प्रक्रिया का पालन करता है।`,

    purposeEn: `The purpose of this guide is to provide all platform users with a clear, step-by-step manual detailing how orders are created, funded, processed, fulfilled, tracked, and finalized across all platform modules.`,
    purposeHi: `इस गाइड का उद्देश्य सभी उपयोगकर्ताओं को एक स्पष्ट चरण-दर-चरण निर्देश पुस्तिका प्रदान करना है, ताकि वे आसानी से समझ सकें कि ऑर्डर कैसे बनाए जाते हैं, एस्क्रौ में जमा होते हैं और सुरक्षित रूप से पूरे होते हैं।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Discovery & Cart Composition',
        titleHi: 'उत्पाद खोज और कार्ट निर्माण',
        descriptionEn: 'Buyers use Universal Search to discover physical goods, services, or job listings. Items are added to the Web3 Unified Cart.',
        descriptionHi: 'ग्राहक यूनिवर्सल सर्च से उत्पादों या सेवाओं को खोजते हैं और उन्हें अपने एकीकृत वेब3 कार्ट (Unified Cart) में जोड़ते हैं।'
      },
      {
        stepNumber: 2,
        titleEn: 'Checkout & Escrow Funding',
        titleHi: 'चेकआउट और एस्क्रौ में फंड लॉक',
        descriptionEn: 'During checkout, the Pi SDK prompts wallet authorization. Pi tokens are transferred into the non-custodial Smart Escrow Vault.',
        descriptionHi: 'चेकआउट के समय Pi SDK वॉलेट ऑथेंटिकेशन मांगता है। निर्धारित Pi राशि सुरक्षित स्मार्ट एस्क्रौ वॉल्ट (Escrow Vault) में जमा हो जाती है।'
      },
      {
        stepNumber: 3,
        titleEn: 'Order Dispatch & Warehouse Fulfillment',
        titleHi: 'ऑर्डर प्रेषण और वेयरहाउस फुलफिलमेंट',
        descriptionEn: 'The merchant receives instant order alerts. The assigned warehouse picks, packs, and attaches a tracking number to the shipment.',
        descriptionHi: 'मर्चेंट को तुरंत ऑर्डर नोटिफिकेशन मिलता है। संबंधित वेयरहाउस माल को पैक करके शिपिंग ट्रैकिंग नंबर जारी करता है।'
      },
      {
        stepNumber: 4,
        titleEn: 'Delivery Verification & Escrow Release',
        titleHi: 'डिलीवरी पुष्टि और फंड रिलीज़',
        descriptionEn: 'Upon package delivery, the buyer clicks "Confirm Delivery" (or courier tracking verification triggers automatic timeout release). Escrow releases Pi to seller.',
        descriptionHi: 'पैकेज प्राप्त होने पर ग्राहक "Confirm Delivery" पर क्लिक करता है, जिसके बाद एस्क्रौ से फंड सीधे विक्रेता के वॉलेट में ट्रांसफर हो जाता है।'
      }
    ],

    benefitsEn: [
      'Deterministic 4-step order lifecycle prevents lost orders or stuck payments.',
      'Real-time status synchronization across mobile app, desktop web, and notification inbox.',
      'Automated courier integration provides end-to-end milestone tracking.',
      'Built-in dispute resolution window safeguards buyers against damaged or non-delivered goods.',
      'Instant invoice generation for merchant accounting and tax record-keeping.'
    ],
    benefitsHi: [
      'स्पष्ट 4-चरणीय ऑर्डर चक्र जिससे ऑर्डर गुम होने या पेमेंट अटकने की समस्या नहीं होती।',
      'मोबाइल ऐप, वेब पोर्टल और इनबॉक्स नोटिफिकेशन के बीच रियल-टाइम स्टेटस सिंक।',
      'स्वचालित कूरियर इंटीग्रेशन जो पल-पल की ट्रैकिंग जानकारी प्रदान करता है।',
      'खराब या न मिलने वाले सामान की स्थिति में खरीदारों के लिए अंतर्निहित विवाद निवारण विंडो।',
      'व्यापारिक लेखांकन के लिए त्वरित डिजिटल चालान (Invoice) जनरेशन।'
    ],

    tipsEn: [
      'Buyers should check tracking updates regularly in the Customer Orders section for expected arrival dates.',
      'Merchants can set up automated order confirmation messages to keep buyers informed at every step.',
      'Always keep shipping receipts until the buyer confirms delivery and escrow funds are released.'
    ],
    tipsHi: [
      'ग्राहक आगमन तिथि जानने के लिए Customer Orders सेक्शन में कूरियर ट्रैकिंग नियमित देखें।',
      'मर्चेंट ग्राहकों को हर अपडेट देने के लिए ऑटोमेटेड ऑर्डर मैसेज चालू रखें।',
      'जब तक एस्क्रौ फंड रिलीज न हो जाए, विक्रेता हमेशा शिपिंग रसीद सुरक्षित रखें।'
    ],

    bestPracticesEn: [
      'Fulfill orders within 24-48 hours to maintain high merchant velocity badges.',
      'Inspect physical packages immediately upon delivery before confirming receipt on the platform.',
      'If an item arrives damaged, open a dispute immediately within the 48-hour post-delivery window.'
    ],
    bestPracticesHi: [
      'उच्च रेटिंग बनाए रखने के लिए 24-48 घंटों के भीतर ऑर्डर शिप करें।',
      'सामान प्राप्त होने पर प्लेटफॉर्म पर पुष्टि करने से पहले पैकेज की अच्छी तरह जांच कर लें।',
      'यदि सामान क्षतिग्रस्त मिले, तो 48 घंटे की विंडो के भीतर तुरंत विवाद (Dispute) दर्ज करें।'
    ],

    notesEn: [
      'Timeout Policy: If courier tracking confirms delivery and the buyer does not confirm within 7 days, escrow auto-releases to the seller.',
      'Cancellation Policy: Unfulfilled orders can be cancelled by the buyer after 72 hours for an immediate full refund.',
      'Security Policy: Platform administrators cannot arbitrarily move escrow funds without cryptographic proof.'
    ],
    notesHi: [
      'टाइमआउट नीति: यदि कूरियर डिलीवरी की पुष्टि करता है और ग्राहक 7 दिनों तक कोई जवाब नहीं देता, तो एस्क्रौ स्वतः विक्रेता को फंड रिलीज कर देता है।',
      'रद्दीकरण नीति: अन-फुलफिल्ड ऑर्डर 72 घंटे बाद ग्राहक द्वारा रद्द किए जाने पर पूरी वापसी (Refund) मिलती है।',
      'सुरक्षा नीति: प्रशासक बिना सबूत के एस्क्रौ फंड में कोई बदलाव नहीं कर सकते।'
    ],

    faqs: [
      {
        questionEn: 'How long does a typical Pi escrow order take to complete?',
        questionHi: 'एक सामान्य Pi एस्क्रौ ऑर्डर पूरा होने में कितना समय लगता है?',
        answerEn: 'The transaction funding is instant. Total time depends on physical shipping distance, usually ranging from 1 to 5 business days.',
        answerHi: 'पेमेंट लॉक होना तुरंत (Instant) होता है। कुल समय केवल कूरियर शिपिंग दूरी पर निर्भर करता है (सामान्यतः 1 से 5 दिन)।'
      },
      {
        questionEn: 'What happens if a package is lost in transit?',
        questionHi: 'यदि पैकेज रास्ते में गुम हो जाए तो क्या होगा?',
        answerEn: 'If tracking shows the item was lost or never delivered, the buyer opens a dispute, and the escrow vault refunds 100% of the Pi back to the buyer.',
        answerHi: 'यदि कूरियर ट्रैकिंग से पैकेज गुम होने की पुष्टि होती है, तो ग्राहक विवाद दर्ज करता है और एस्क्रौ से 100% Pi वापस मिल जाती है।'
      },
      {
        questionEn: 'Can I change my delivery address after placing an order?',
        questionHi: 'क्या ऑर्डर देने के बाद डिलीवरी का पता बदला जा सकता है?',
        answerEn: 'Addresses can be updated via Inbox messaging directly with the merchant before the order status transitions to "In Transit".',
        answerHi: 'ऑर्डर "In Transit" होने से पहले मर्चेंट को इनबॉक्स संदेश भेजकर पता बदला जा सकता है।'
      },
      {
        questionEn: 'How do service milestone payments work?',
        questionHi: 'सर्विस माइलस्टोन पेमेंट्स कैसे काम करती हैं?',
        answerEn: 'For large projects or services, payment is split into milestones (e.g. 50% upfront in escrow, 50% upon final delivery). Each milestone releases upon approval.',
        answerHi: 'बड़े प्रोजेक्ट्स के लिए भुगतान माइलस्टोन (जैसे 50% शुरुआती एस्क्रौ, 50% काम पूरा होने पर) में बँटा होता है। प्रत्येक चरण की स्वीकृति पर फंड रिलीज होता है।'
      }
    ]
  },

  // ==========================================
  // 8. HOW THE PLATFORM WORKS - SYSTEM ARCHITECTURE
  // ==========================================
  {
    id: 'system-architecture',
    titleEn: 'System Architecture (High-Level)',
    titleHi: 'सिस्टम आर्किटेक्चर (High-Level System Architecture)',
    categoryEn: 'How the Platform Works',
    categoryHi: 'प्लेटफॉर्म कैसे काम करता है',
    badge: 'Technical Specs',
    summaryEn: 'Deep architectural blueprint detailing client layers, Express node servers, Firebase state engine, Pi SDK bridge, and Smart Escrow contract infrastructure.',
    summaryHi: 'क्लाइंट लेयर, एक्सप्रेस नोड सर्वर, फायरबेस स्टेट इंजन, Pi SDK ब्रिज और स्मार्ट एस्क्रौ इंफ्रास्ट्रक्चर की गहराई से तकनीकी वास्तुकला।',

    overviewEn: `Pi Business Market employs a modern, multi-tier full-stack microservices architecture engineered for high availability, fault tolerance, and zero-trust Web3 security. The system integrates a React + Vite + Tailwind frontend layer, an Express.js backend API gateway running on Node.js (Port 3000 containerized via Cloud Run), a Firebase Firestore realtime cloud data store, and a direct cryptographic bridge to the Pi Network Blockchain SDK.`,
    overviewHi: `Pi Business Market एक अत्याधुनिक, मल्टी-टियर फुल-स्टैक माइक्रोसर्विसेज आर्किटेक्चर पर आधारित है। इसे उच्च उपलब्धता (High Availability) और जीरो-ट्रस्ट Web3 सुरक्षा के लिए डिज़ाइन किया गया है। इसमें React + Vite फ्रंटएंड, एक्सप्रेस.जीएस (Express.js) बैकएंड API गेटवे, फायरबेस फिएरस्टोर (Firestore) डेटाबेस और Pi ब्लॉकचेन SDK का सीधा एकीकरण शामिल है।`,

    purposeEn: `The purpose of the System Architecture section is to provide enterprise architects, developers, security auditors, and system integrators with a comprehensive technical specification of how data flows, how state is persisted, and how cryptographic isolation is maintained between components.`,
    purposeHi: `सिस्टम आर्किटेक्चर का उद्देश्य डेवलपर्स, एंटरप्राइज आर्किटेक्ट्स और सिक्योरिटी ऑडिटर्स को यह विस्तृत तकनीकी जानकारी देना है कि डेटा कैसे फ्लो होता है और घटकों के बीच सुरक्षा कैसे बनी रहती है।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Client Presentation Layer (React + Vite)',
        titleHi: 'क्लाइंट प्रेजेंटेशन लेयर (React + Vite)',
        descriptionEn: 'Renders responsive UI inside the Pi Browser or web iframe. Handles state management, UI transitions, local client caches, and wallet event listeners.',
        descriptionHi: 'Pi Browser या वेब में रिस्पॉन्सिव UI रेंडर करता है। यह स्टेट मैनेजमेंट, क्लाइंट कैश और वॉलेट इवेंट्स को संभालता है।'
      },
      {
        stepNumber: 2,
        titleEn: 'API Gateway & Middleware Layer (Express.js)',
        titleHi: 'API गेटवे और मिडलवेयर लेयर (Express.js)',
        descriptionEn: 'Proxies API routes (/api/auth/pi, /api/escrow, /api/inventory), validates backend Pi access tokens, enforces rate limits, and sanitizes input data.',
        descriptionHi: 'API रूट्स (/api/auth/pi, /api/escrow) को प्रॉक्सी करता है, एक्सेस टोकन की पुष्टि करता है और इनपुट डेटा को सुरक्षित रखता है।'
      },
      {
        stepNumber: 3,
        titleEn: 'Persistence & Realtime State Engine (Firebase Firestore)',
        titleHi: 'डेटाबेस और रियल-टाइम स्टेट इंजन (Firestore)',
        descriptionEn: 'Stores user profiles, store catalogs, order states, warehouse stock levels, CRM records, and dispute logs with strict security rule enforcement.',
        descriptionHi: 'उपयोगकर्ता प्रोफाइल, कैटलॉग, ऑर्डर स्टेट्स, वेयरहाउस इन्वेंटरी और विवाद लॉग्स को सख्त सुरक्षा नियमों के साथ स्टोर करता है।'
      },
      {
        stepNumber: 4,
        titleEn: 'Web3 Pi Blockchain & Escrow Vault Bridge',
        titleHi: 'Web3 Pi ब्लॉकचेन और एस्क्रौ वॉल्ट ब्रिज',
        descriptionEn: 'Executes cryptographic payment authorization calls, verifies payment transactions against Pi Network nodes, and manages smart escrow locks.',
        descriptionHi: 'क्रिप्टोग्राफिक पेमेंट ऑथेंटिकेशन कॉल निष्पादित करता है और ब्लॉकचेन नोड्स से लेनदेन की पुष्टि करता है।'
      }
    ],

    benefitsEn: [
      'Cloud Run Containerization guarantees auto-scaling from zero to thousands of concurrent requests.',
      'Decoupled microservice architecture ensures server failures do not impact stored database state.',
      'Server-side API proxying keeps secret keys and backend logic 100% hidden from client DevTools.',
      'Realtime Firestore listeners ensure instant UI state updates without page refreshes.',
      'Zero-knowledge authentication preserving user privacy and seed phrase confidentiality.'
    ],
    benefitsHi: [
      'क्लाउड रन कंटेनराइजेशन ऑटो-स्केलिंग सुनिश्चित करता है ताकि भारी ट्रैफ़िक में भी ऐप सुचारू चले।',
      'पृथक माइक्रोसर्विसेज आर्किटेक्चर से सर्वर खराबी होने पर भी डेटाबेस सुरक्षित रहता है।',
      'सर्वर-साइड API प्रॉक्सी गुप्त API कीज (Keys) को ब्राउज़र से 100% छिपाकर सुरक्षित रखती है।',
      'रियल-टाइम डेटाबेस लिसनर्स से बिना पेज रिफ्रेश किए तुरंत स्क्रीन अपडेट होती है।',
      'जीरो-नॉलेज ऑथेंटिकेशन उपयोगकर्ता की गोपनीयता और वॉलेट सुरक्षा बनाए रखता है।'
    ],

    tipsEn: [
      'Developers integrating custom apps can inspect network headers to verify Pi token validation signatures.',
      'Utilize webhooks for real-time order state updates instead of polling API endpoints repeatedly.',
      'Review Firestore Security Rules in the codebase to understand row-level data access constraints.'
    ],
    tipsHi: [
      'कस्टम ऐप्स जोड़ने वाले डेवलपर्स नेटवर्क हेडर्स की जांच करके टोकन सिग्नेचर की पुष्टि कर सकते हैं।',
      'बार-बार API कॉल करने के बजाय रियल-टाइम अपडेट के लिए वेबहुक्स (Webhooks) का उपयोग करें।',
      'डेटा एक्सेस सीमाओं को समझने के लिए कोडबेस में सुरक्षा नियमों का अध्ययन करें।'
    ],

    bestPracticesEn: [
      'Always perform heavy calculations (like bulk wholesale pricing) on the backend server to prevent client-side tampering.',
      'Maintain environment variables exclusively in process.env / .env.example files as documented in deployment guidelines.',
      'Implement graceful offline handling for mobile Pi Browser clients experiencing weak internet connectivity.'
    ],
    bestPracticesHi: [
      'छेड़छाड़ रोकने के लिए कीमतों की जटिल गणना हमेशा बैकएंड सर्वर पर ही निष्पादित करें।',
      'सुरक्षा के लिए सभी संवेदनशील चर (Environment Variables) को `.env` फाइलों में ही रखें।',
      'कमजोर इंटरनेट कनेक्टिविटी की स्थिति में मोबाइल उपयोगकर्ताओं के लिए ऑफ़लाइन कैशिंग प्रदान करें।'
    ],

    notesEn: [
      'Network Specs: Node.js server binds to 0.0.0.0 on Port 3000 behind NGINX reverse proxy.',
      'Escrow Architecture: Escrow state mutations require cryptographic multi-signature authorization.',
      'Uptime SLA: 99.99% availability backed by multi-region Cloud Run container failover.'
    ],
    notesHi: [
      'नेटवर्क विवरण: Node.js सर्वर NGINX रिवर्स प्रॉक्सी के पीछे पोर्ट 3000 पर बाइंड होता है।',
      'एस्क्रौ आर्किटेक्चर: एस्क्रौ बदलावों के लिए क्रिप्टोग्राफिक मल्टी-सिग्नेचर ऑथेंटिकेशन आवश्यक है।',
      'अपटाइम SLA: 99.99% उपलब्धता मल्टी-रीजन फ़ेलओवर द्वारा समर्थित है।'
    ],

    faqs: [
      {
        questionEn: 'How does the backend proxy protect private API keys?',
        questionHi: 'बैकएंड प्रॉक्सी प्राइवेट API कीज को कैसे सुरक्षित रखता है?',
        answerEn: 'All sensitive operations (e.g. Pi payment verification, database admin writes) are executed strictly on the server-side Node.js environment. No private keys are exposed to client JavaScript.',
        answerHi: 'सभी संवेदनशील प्रक्रियाएं (जैसे टोकन वेरिफिकेशन, डेटाबेस राइट्स) केवल बैकएंड सर्वर पर होती हैं। कोई भी प्राइवेट की ब्राउज़र जावास्क्रिप्ट में उजागर नहीं होती।'
      },
      {
        questionEn: 'What database is used for storing real-time order updates?',
        questionHi: 'रियल-टाइम ऑर्डर अपडेट स्टोर करने के लिए किस डेटाबेस का उपयोग किया जाता है?',
        answerEn: 'Firebase Firestore is used as the primary real-time database, providing automatic multi-region replication and instant WebSocket document sync.',
        answerHi: 'फायरबेस फायरस्टोर (Firebase Firestore) मुख्य डेटाबेस है, जो रियल-टाइम वेबसॉकेट सिंक और मल्टी-रीजन बैकअप देता है।'
      },
      {
        questionEn: 'How does the application scale during flash sales or heavy traffic?',
        questionHi: 'फ्लैश सेल या भारी ट्रैफिक के दौरान एप्लीकेशन कैसे स्केल होती है?',
        answerEn: 'The backend runs inside containerized Cloud Run instances that automatically spin up additional CPU/RAM containers dynamically as request volume grows.',
        answerHi: 'बैकएंड क्लाउड रन कंटेनरों में चलता है, जो ट्रैफिक बढ़ने पर अपने आप नए सर्वर कंटेनर शुरू करके स्केल कर लेता है।'
      },
      {
        questionEn: 'Can third-party systems receive automated webhooks when an order is completed?',
        questionHi: 'क्या ऑर्डर पूरा होने पर थर्ड-पार्टी सिस्टम्स को ऑटोमेटेड वेबहुक्स मिल सकते हैं?',
        answerEn: 'Yes! Merchant Enterprise accounts can register HTTP Webhook URLs in their settings to receive JSON order notifications automatically.',
        answerHi: 'हाँ! एंटरप्राइज मर्चेंट्स अपनी सेटिंग्स में HTTP Webhook URLs जोड़कर स्वचालित JSON ऑर्डर नोटिफिकेशन प्राप्त कर सकते हैं।'
      }
    ]
  },

  // ==========================================
  // 9. DOCUMENTATION NAVIGATION & USER GUIDE
  // ==========================================
  {
    id: 'documentation-navigation',
    titleEn: 'Documentation Navigation & User Guide',
    titleHi: 'नेविगेशन और उपयोग निर्देश (Documentation Navigation)',
    categoryEn: 'Documentation Navigation',
    categoryHi: 'नेविगेशन और उपयोग निर्देश',
    badge: 'User Manual',
    summaryEn: 'Comprehensive guide on how to search, navigate, filter, toggle languages, and utilize code samples within the Pi Business Market documentation portal.',
    summaryHi: 'डॉक्यूमेंटेशन पोर्टल में खोजने, नेविगेट करने, भाषा बदलने और कोड उदाहरणों का उपयोग करने का विस्तृत यूजर मैनुअल।',

    overviewEn: `The Pi Business Market Documentation Portal is engineered to provide instant, structured access to technical guides, operational workflows, API references, and enterprise specifications. Built with interactive search, instant category filters, dual-language translation controls (English & Easy Hindi), code snippet copying, and step-by-step visual flows, this portal ensures both non-technical business owners and software engineers can locate answers in seconds.`,
    overviewHi: `Pi Business Market का डॉक्यूमेंटेशन पोर्टल इस प्रकार बनाया गया है कि यह आपको तकनीकी गाइड्स, व्यावसायिक प्रक्रियाओं, API रेफरेंस और सुरक्षा नियमों तक तुरंत पहुँच प्रदान करता है। इसमें त्वरित खोज (Search), श्रेणी फ़िल्टर, द्विभाषी स्विच (English और Easy Hindi) और कॉपी योग्य कोड उदाहरण शामिल हैं।`,

    purposeEn: `The purpose of Documentation Navigation is to teach users how to maximize their productivity when reading platform docs, switching between language modes, finding specific FAQ answers, and navigating between developer and merchant topics.`,
    purposeHi: `नेविगेशन और उपयोग निर्देश का उद्देश्य उपयोगकर्ताओं को डॉक्यूमेंटेशन पोर्टल की सभी सुविधाओं (जैसे भाषा बदलना, विषय खोजना, और अक्सर पूछे जाने वाले प्रश्नों के उत्तर पाना) का पूरा उपयोग सिखाना है।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Universal Interactive Search Bar',
        titleHi: 'यूनिवर्सल सर्च बार',
        descriptionEn: 'Type keywords (e.g. "Escrow", "KYC", "Warehouse", "B2B") into the top search input to filter topics in real-time.',
        descriptionHi: 'शीर्ष सर्च बार में कोई भी शब्द (जैसे "Escrow", "KYC", "Warehouse") टाइप करके तुरंत संबंधित लेख ढूंढें।'
      },
      {
        stepNumber: 2,
        titleEn: 'Language Mode Switcher',
        titleHi: 'भाषा स्विच बटन (English / Easy Hindi)',
        descriptionEn: 'Toggle between English, Easy Hindi (Hinglish with English technical terms), or Dual View mode for side-by-side comprehension.',
        descriptionHi: 'अपनी पसंद के अनुसार English, Easy Hindi (सरल हिंदी) या Dual View मोड में स्विच करें।'
      },
      {
        stepNumber: 3,
        titleEn: 'Sidebar Category Navigation Tree',
        titleHi: 'साइडबार श्रेणी नेविगेशन',
        descriptionEn: 'Use the left sidebar menu to jump directly between "Getting Started", "About the Platform", "How the Platform Works", and "User Manual".',
        descriptionHi: 'बायें साइडबार का उपयोग करके सीधे मुख्य विषयों (Getting Started, About, How it Works) पर नेविगेट करें।'
      },
      {
        stepNumber: 4,
        titleEn: 'Interactive Callouts & Accordion FAQs',
        titleHi: 'इंटरएक्टिव टिप्स और FAQ कार्ड्स',
        descriptionEn: 'Expand structured FAQ accordions, copy recommended code snippets, and review highlighted Tips, Notes, and Best Practices cards.',
        descriptionHi: 'अक्सर पूछे जाने वाले प्रश्नों को खोलें, कोड उदाहरण कॉपी करें और टिप्स, नोट्स व बेस्ट प्रैक्टिस कार्ड्स का लाभ उठाएं।'
      }
    ],

    benefitsEn: [
      'Instant Search with zero latency filtering across all document categories.',
      'Bilingual support allowing easy comprehension for international and Hindi-speaking regional merchants.',
      'Structured standardized layout (Overview, Purpose, How it Works, Benefits, Tips, Best Practices, Notes, FAQs) for every topic.',
      'One-click links to jump directly to active application dashboards (Catalog, Warehouses, CRM, Checkout).',
      'Print & PDF friendly rendering for enterprise compliance archiving.'
    ],
    benefitsHi: [
      'सभी विषयों में शून्य-विलंबता के साथ तुरंत खोजने की सुविधा (Instant Search)।',
      'अंतर्राष्ट्रीय और क्षेत्रीय दोनों व्यापारियों की सुविधा के लिए पूर्ण द्विभाषी (Bilingual) समर्थन।',
      'हर विषय के लिए एक समान स्पष्ट संरचना (Overview, Purpose, How it Works, Benefits, Tips, Best Practices, Notes, FAQs)।',
      'डॉक्यूमेंट से सीधे सक्रिय डैशबोर्ड (Catalog, Inventory, CRM) पर जाने के लिए क्विक लिंक्स।',
      'आसान प्रिंटिंग और PDF डाउनलोड अनुकूल रेंडरिंग।'
    ],

    tipsEn: [
      'Bookmark frequently used documentation sections in your web browser for quick reference during daily store operations.',
      'Use the Dual Language mode if you want to read in Easy Hindi while keeping technical terms in English for context.',
      'Click on any internal link tag within a guide to navigate straight to the corresponding live app feature.'
    ],
    tipsHi: [
      'दैनिक दुकान संचालन में तुरंत देखने के लिए महत्वपूर्ण डॉक्यूमेंटेशन पेजों को ब्राउज़र में बुकमार्क करें।',
      'तकनीकी शब्दों को अंग्रेजी में रखते हुए सरल हिंदी में पढ़ने के लिए Dual Language मोड चुनें।',
      'गाइड में दिए गए किसी भी डायरेक्ट लिंक पर क्लिक करके सीधे चालू ऐप फीचर (Live App) पर जाएं।'
    ],

    bestPracticesEn: [
      'Encourage store staff and inventory managers to read the "Who Can Use" and "Warehouse" sections during staff onboarding.',
      'Check the FAQs accordion section first when encountering operational questions about escrow timeouts or shipping policies.',
      'Share specific documentation URLs with buyers or suppliers when explaining order fulfillment workflows.'
    ],
    bestPracticesHi: [
      'नए कर्मचारियों को काम पर रखते समय उन्हें "Who Can Use" और "Warehouse" सेक्शन पढ़ने के लिए प्रेरित करें।',
      'ऑर्डर या शिपिंग नीति के बारे में सवाल होने पर सबसे पहले संबंधित विषय का FAQ सेक्शन जांचें।',
      'ग्राहकों या सप्लायर्स को व्यापार प्रक्रिया समझाते समय विशिष्ट डॉक्यूमेंटेशन लिंक साझा करें।'
    ],

    notesEn: [
      'Version Note: This documentation portal reflects Version 2.0 of the Pi Business Market Enterprise Protocol.',
      'Accessibility Note: Screen readers and high-contrast color modes are fully supported across all doc components.',
      'Offline Note: Documentation pages are cached locally for continued reading during temporary network dropouts.'
    ],
    notesHi: [
      'संस्करण नोट: यह डॉक्यूमेंटेशन पोर्टल Pi Business Market एंटरप्राइज प्रोटोकॉल के संस्करण 2.0 पर आधारित है।',
      'एक्सेसिबिलिटी नोट: स्क्रीन रीडर और हाई-कंट्रास्ट मोड सभी पेजों पर पूर्ण समर्थित हैं।',
      'ऑफ़लाइन नोट: अस्थायी इंटरनेट रुकने पर भी डॉक्यूमेंटेशन पेज पढ़े जा सकते हैं।'
    ],

    faqs: [
      {
        questionEn: 'How do I search for a specific keyword in the documentation?',
        questionHi: 'मैं डॉक्यूमेंटेशन में कोई विशिष्ट शब्द कैसे खोजूं?',
        answerEn: 'Simply click the search input at the top of the documentation page and type any term like "Escrow", "Pi SDK", or "B2B". The list updates dynamically.',
        answerHi: 'ऊपर दिए गए खोज बॉक्स (Search Box) में क्लिक करें और कोई भी शब्द जैसे "Escrow" या "B2B" टाइप करें। परिणाम तुरंत सामने आ जाएंगे।'
      },
      {
        questionEn: 'How do I switch the language to Easy Hindi?',
        questionHi: 'मैं भाषा को Easy Hindi (हिंदी) में कैसे बदलूं?',
        answerEn: 'Click the "Language" toggle in the documentation header bar and select "Easy Hindi" or "Dual View". All content will translate instantly.',
        answerHi: 'डॉक्यूमेंटेशन हेडर बार में "Language" बटन पर क्लिक करें और "Easy Hindi" या "Dual View" चुनें। पूरा कंटेंट तुरंत अनुवादित हो जाएगा।'
      },
      {
        questionEn: 'Can I copy code snippets from the architecture guides?',
        questionHi: 'क्या मैं आर्किटेक्चर गाइड्स से कोड उदाहरण कॉपी कर सकता हूं?',
        answerEn: 'Yes! Every code block includes a "Copy Code" button in the top right corner that places the clean source snippet directly onto your clipboard.',
        answerHi: 'हाँ! प्रत्येक कोड ब्लॉक के ऊपर "Copy Code" बटन है जो एक क्लिक में कोड आपके क्लिपबोर्ड पर कॉपी कर देता है।'
      },
      {
        questionEn: 'Where can I ask for help if I cannot find an answer in the docs?',
        questionHi: 'यदि मुझे डॉक्यूमेंटेशन में उत्तर न मिले तो मैं सहायता कहाँ से ले सकता हूं?',
        answerEn: 'You can use the built-in Inbox Page to contact Pi Business Market Support directly or participate in the Pi Network Community Forum.',
        answerHi: 'आप Pi Business Market सपोर्ट से संपर्क करने के लिए ऐप में बने इनबॉक्स (Inbox) पेज का उपयोग कर सकते हैं।'
      }
    ]
  },

  // ==========================================
  // 5. GETTING STARTED - PREREQUISITES & SETUP
  // ==========================================
  {
    id: 'prerequisites-setup',
    titleEn: 'Prerequisites & Setup',
    titleHi: 'आवश्यकताएं और सेटअप (Prerequisites)',
    categoryEn: 'Getting Started',
    categoryHi: 'शुरुआत करें',
    badge: 'Essential',
    summaryEn: 'Everything you need before accessing Pi Business Market: Pi Browser installation, account eligibility, and wallet configuration.',
    summaryHi: 'Pi Business Market शुरू करने से पहले जरूरी चीजें: Pi Browser इंस्टॉलेशन, अकाउंट पात्रता और वॉलेट सेटअप।',

    overviewEn: `Before you can trade, sell, or hire on Pi Business Market, your environment must be properly configured within the Pi Network ecosystem. As a Web3 platform, we rely on the secure sandbox provided by the Pi Browser to handle cryptographic operations and wallet authorizations. You must ensure you have a verified Pi account and a functional Pi Wallet (Testnet or Mainnet) to interact with the marketplace smart contracts.`,
    overviewHi: `Pi Business Market पर व्यापार करने या सेवाएं देने से पहले, आपका एनवायरनमेंट Pi नेटवर्क इकोसिस्टम के अनुसार कॉन्फ़िगर होना चाहिए। एक Web3 प्लेटफॉर्म होने के नाते, हम वॉलेट ऑथराइजेशन के लिए Pi Browser के सुरक्षित सैंडबॉक्स पर निर्भर हैं। आपके पास एक सत्यापित Pi अकाउंट और सक्रिय Pi वॉलेट (Testnet या Mainnet) होना अनिवार्य है।`,

    purposeEn: `The purpose of this guide is to ensure that new users (Pioneers) and prospective merchants have the technical foundation required to use Web3 features like Escrow, automated payments, and decentralized identity verification. Following these steps prevents login failures and transaction errors.`,
    purposeHi: `इस गाइड का उद्देश्य यह सुनिश्चित करना है कि नए उपयोगकर्ताओं (Pioneers) और व्यापारियों के पास एस्क्रौ, ऑटोमेटेड पेमेंट्स और सुरक्षित पहचान सत्यापन (Verification) जैसी Web3 सुविधाओं का उपयोग करने के लिए आवश्यक तकनीकी आधार हो।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Install Pi Browser App',
        titleHi: 'Pi Browser ऐप इंस्टॉल करें',
        descriptionEn: 'Download the official Pi Browser from the iOS App Store or Google Play Store. [Screenshot: Pi Browser Store Page]',
        descriptionHi: 'iOS App Store या Google Play Store से आधिकारिक Pi Browser डाउनलोड करें। [Screenshot: Pi Browser Store Page]'
      },
      {
        stepNumber: 2,
        titleEn: 'Sign-in to Pi Network',
        titleHi: 'Pi नेटवर्क में साइन-इन करें',
        descriptionEn: 'Open the Pi Browser and log in using your Pi Network credentials. Ensure your username is unique and verified.',
        descriptionHi: 'Pi Browser खोलें और अपने Pi नेटवर्क क्रेडेंशियल्स के साथ लॉगिन करें। सुनिश्चित करें कि आपका यूजरनेम सत्यापित है।'
      },
      {
        stepNumber: 3,
        titleEn: 'Generate Pi Wallet',
        titleHi: 'Pi वॉलेट जनरेट करें',
        descriptionEn: 'Navigate to "wallet.pi" inside the Pi Browser. Generate your 24-word passphrase and secure it safely. [Screenshot: Wallet Creation]',
        descriptionHi: 'Pi Browser के भीतर "wallet.pi" पर जाएं। अपना 24-शब्दों का पासफ़्रेज़ (Passphrase) जनरेट करें और इसे सुरक्षित रखें।'
      },
      {
        stepNumber: 4,
        titleEn: 'Verify Mainnet Checklist',
        titleHi: 'मैननेट चेकलिस्ट सत्यापित करें',
        descriptionEn: 'For live transactions, ensure you have completed the Mainnet migration checklist in the Pi mining app.',
        descriptionHi: 'लाइव लेनदेन के लिए, सुनिश्चित करें कि आपने Pi माइनिंग ऐप में "Mainnet Migration Checklist" पूरी कर ली है।'
      }
    ],

    benefitsEn: [
      'Direct integration with Pi Wallet for seamless one-click payments.',
      'Cryptographic security provided by the Pi Browser sandbox environment.',
      'Automatic identity resolution—no need for traditional email/password signups.',
      'Access to both Testnet (for learning) and Mainnet (for real trade).'
    ],
    benefitsHi: [
      'आसान वन-क्लिक पेमेंट के लिए सीधे Pi वॉलेट के साथ एकीकरण।',
      'Pi Browser सैंडबॉक्स वातावरण द्वारा प्रदान की गई उच्चतम सुरक्षा।',
      'स्वचालित पहचान सत्यापन—पारंपरिक ईमेल/पासवर्ड की जरूरत नहीं।',
      'टेस्टनेट (सीखने के लिए) और मैननेट (व्यापार के लिए) दोनों तक पहुंच।'
    ],

    tipsEn: [
      'Always keep your 24-word wallet passphrase offline. Never type it into any website other than the official Pi Wallet.',
      'If using a desktop, you can use the Pi Node or Pi Desktop portal for a larger view of the marketplace.',
      'Check your balance in the Wallet app before attempting a checkout on Pi Business Market.'
    ],
    tipsHi: [
      'अपना 24-शब्दों का वॉलेट पासफ़्रेज़ हमेशा ऑफ़लाइन रखें। इसे कभी किसी बाहरी वेबसाइट पर साझा न करें।',
      'यदि आप डेस्कटॉप का उपयोग कर रहे हैं, तो बड़े व्यू के लिए Pi Node या Pi Desktop पोर्टल का उपयोग कर सकते हैं।',
      'चेकआउट करने से पहले हमेशा वॉलेट ऐप में अपना बैलेंस जांचें।'
    ],

    bestPracticesEn: [
      'Complete your KYC as early as possible to unlock full merchant and buying capabilities.',
      'Use the same Pi account consistently to build a high reputation score on the platform.',
      'Test your setup by sending a small amount of Testnet Pi to the Sandbox Escrow first.'
    ],
    bestPracticesHi: [
      'मर्चेंट सुविधाओं का पूर्ण लाभ उठाने के लिए जल्द से जल्द अपनी KYC पूरी करें।',
      'उच्च प्रतिष्ठा स्कोर (Reputation Score) बनाने के लिए हमेशा एक ही Pi अकाउंट का उपयोग करें।',
      'सैंडबॉक्स एस्क्रौ में छोटी मात्रा में टेस्टनेट Pi भेजकर अपने सेटअप की जांच करें।'
    ],

    notesEn: [
      'System Requirement: Android 6.0+ or iOS 11.0+ is recommended for optimal Pi Browser performance.',
      'Error Info: "Wallet not found" usually means you have not generated a wallet yet inside wallet.pi.',
      'Privacy: Pi Business Market only sees your public wallet address; we never see your passphrase.'
    ],
    notesHi: [
      'सिस्टम आवश्यकता: बेहतर परफॉरमेंस के लिए Android 6.0+ या iOS 11.0+ का उपयोग करें।',
      'त्रुटि सूचना: "Wallet not found" का अर्थ है कि आपने अभी तक wallet.pi में वॉलेट नहीं बनाया है।',
      'गोपनीयता: हम केवल आपका पब्लिक वॉलेट एड्रेस देख सकते हैं, पासफ़्रेज़ कभी नहीं।'
    ],

    faqs: [
      {
        questionEn: 'Do I need a separate account for Pi Business Market?',
        questionHi: 'क्या मुझे इसके लिए अलग अकाउंट की जरूरत है?',
        answerEn: 'No. You use your existing Pi Network account. Simply authenticate via the Pi SDK to link your profile.',
        answerHi: 'नहीं, आप अपने मौजूदा Pi नेटवर्क अकाउंट का ही उपयोग करेंगे। लॉगिन के लिए बस Pi SDK का उपयोग करें।'
      },
      {
        questionEn: 'Can I use a regular web browser like Chrome or Safari?',
        questionHi: 'क्या मैं Chrome या Safari का उपयोग कर सकता हूं?',
        answerEn: 'Yes, but wallet interactions and payments will require you to eventually open the link inside the Pi Browser for security.',
        answerHi: 'हाँ, लेकिन भुगतान और वॉलेट सुरक्षा के लिए आपको अंततः लिंक को Pi Browser में ही खोलना होगा।'
      }
    ]
  },

  // ==========================================
  // 6. GETTING STARTED - LOGIN & AUTHENTICATION
  // ==========================================
  {
    id: 'login-auth',
    titleEn: 'Login & Authentication',
    titleHi: 'लॉगिन और ऑथेंटिकेशन (Login Guide)',
    categoryEn: 'Getting Started',
    categoryHi: 'शुरुआत करें',
    badge: 'Security',
    summaryEn: 'Step-by-step login guide using Pi SDK, first-time onboarding flow, and password-less security overview.',
    summaryHi: 'Pi SDK का उपयोग करके लॉगिन गाइड, पहली बार ऑनबोर्डिंग प्रक्रिया और पासवर्ड-लेस सुरक्षा का विवरण।',

    overviewEn: `Pi Business Market uses a modern Web3 authentication system. Instead of traditional usernames and passwords that are prone to theft, we use the Pi Network SDK to verify your identity. This process is instant, secure, and ensures that your account is tied directly to your verified Pi Network profile. On your first login, you will be guided through a short onboarding process to select your primary role.`,
    overviewHi: `Pi Business Market एक आधुनिक Web3 ऑथेंटिकेशन सिस्टम का उपयोग करता है। पारंपरिक यूजरनेम और पासवर्ड के बजाय, हम आपकी पहचान सत्यापित करने के लिए Pi Network SDK का उपयोग करते हैं। यह प्रक्रिया सुरक्षित और तेज है। पहली बार लॉगिन करने पर, आपको अपनी भूमिका (Role) चुनने की प्रक्रिया से गुजरना होगा।`,

    purposeEn: `This guide helps users navigate the password-less sign-in experience and understand how their data is synchronized between the Pi Network and our marketplace. It also covers the "First Login" experience where users define their business or shopper persona.`,
    purposeHi: `यह गाइड उपयोगकर्ताओं को बिना पासवर्ड के साइन-इन करने और Pi नेटवर्क के साथ डेटा सिंक करने की प्रक्रिया को समझने में मदद करती है।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Access the Portal',
        titleHi: 'पोर्टल एक्सेस करें',
        descriptionEn: 'Visit the Pi Business Market URL. You will see the Welcome screen with the "Authenticate" button. [Screenshot: Login Page]',
        descriptionHi: 'Pi Business Market लिंक पर जाएं। आपको "Authenticate" बटन के साथ वेलकम स्क्रीन दिखेगी।'
      },
      {
        stepNumber: 2,
        titleEn: 'Authorize with Pi SDK',
        titleHi: 'Pi SDK के साथ ऑथराइज करें',
        descriptionEn: 'Click "Login with Pi". A popup from the Pi Browser will ask for permission to share your username and wallet address.',
        descriptionHi: '"Login with Pi" पर क्लिक करें। Pi Browser आपसे यूजरनेम और वॉलेट एड्रेस साझा करने की अनुमति मांगेगा।'
      },
      {
        stepNumber: 3,
        titleEn: 'Select Primary Role',
        titleHi: 'अपनी भूमिका चुनें',
        descriptionEn: 'Choose whether you are primarily a Buyer (Pioneer), Merchant (Seller), or Warehouse Partner. You can change this later.',
        descriptionHi: 'चुनें कि आप खरीदार (Buyer), मर्चेंट (Seller), या वेयरहाउस पार्टनर हैं। इसे बाद में बदला जा सकता है।'
      },
      {
        stepNumber: 4,
        titleEn: 'Initial Sync',
        titleHi: 'प्रारंभिक सिंक',
        descriptionEn: 'Wait for the system to sync your Pi profile and set up your personal dashboard workspace. [Screenshot: Loading Screen]',
        descriptionHi: 'सिस्टम द्वारा आपकी प्रोफाइल सिंक करने और डैशबोर्ड सेटअप करने तक प्रतीक्षा करें।'
      }
    ],

    benefitsEn: [
      'No passwords to remember or lose.',
      'Instant verification of your Pi Network username and KYC status.',
      'Direct connection to your Pi Wallet for secure checkouts.',
      'One-tap login experience on mobile devices.'
    ],
    benefitsHi: [
      'पासवर्ड याद रखने या खोने का कोई झंझट नहीं।',
      'आपके Pi यूजरनेम और KYC स्टेटस का तुरंत सत्यापन।',
      'सुरक्षित चेकआउट के लिए आपके Pi वॉलेट से सीधा जुड़ाव।',
      'मोबाइल पर वन-टैप (One-tap) लॉगिन का अनुभव।'
    ],

    tipsEn: [
      'If the login button doesn\'t respond, refresh the page or ensure you are inside the Pi Browser.',
      'Granting permissions to Pi Business Market is safe—we cannot spend your Pi without your manual approval for each order.',
      'Use the "Remember Me" feature for faster access in future sessions.'
    ],
    tipsHi: [
      'यदि लॉगिन बटन काम नहीं कर रहा है, तो पेज रिफ्रेश करें या सुनिश्चित करें कि आप Pi Browser के भीतर हैं।',
      'Pi Business Market को अनुमति देना सुरक्षित है—हम आपकी अनुमति के बिना Pi खर्च नहीं कर सकते।'
    ],

    bestPracticesEn: [
      'Log out when using public or shared devices to maintain account security.',
      'Review your connected apps in the Pi mining app to manage permissions.',
      'Ensure your mobile OS is updated to the latest version to avoid SDK compatibility issues.'
    ],
    bestPracticesHi: [
      'खाता सुरक्षा के लिए सार्वजनिक डिवाइस पर इस्तेमाल के बाद हमेशा लॉग आउट करें।',
      'अनुमतियां प्रबंधित करने के लिए Pi माइनिंग ऐप में "Connected Apps" की समीक्षा करें।'
    ],

    notesEn: [
      'Auth Failure: If you see "Authentication Denied," check if your Pi Browser has internet access.',
      'Session Duration: For security, sessions expire after 24 hours of inactivity.',
      'Data Privacy: We do not store your private keys. All signing happens on the client-side.'
    ],
    notesHi: [
      'लॉगिन विफलता: यदि "Authentication Denied" दिखे, तो इंटरनेट कनेक्शन की जांच करें।',
      'डेटा गोपनीयता: हम आपकी प्राइवेट की (Private Key) स्टोर नहीं करते हैं।'
    ],

    faqs: [
      {
        questionEn: 'Why do I need to authorize the Pi SDK?',
        questionHi: 'मुझे Pi SDK को ऑथराइज करने की आवश्यकता क्यों है?',
        answerEn: 'The SDK securely links your Pi identity to the marketplace, enabling decentralized payments and profile verification without passwords.',
        answerHi: 'SDK आपकी Pi पहचान को मार्केटप्लेस से सुरक्षित रूप से जोड़ता है, जिससे बिना पासवर्ड के भुगतान संभव होता है।'
      },
      {
        questionEn: 'Can I log in using Google or Facebook?',
        questionHi: 'क्या मैं Google या Facebook से लॉगिन कर सकता हूं?',
        answerEn: 'No. To ensure the integrity of the Pi ecosystem, only Pi Network authentication is supported.',
        answerHi: 'नहीं, सुरक्षा और शुद्धता बनाए रखने के लिए केवल Pi नेटवर्क ऑथेंटिकेशन ही मान्य है।'
      }
    ]
  },

  // ==========================================
  // 7. GETTING STARTED - DASHBOARD & NAVIGATION
  // ==========================================
  {
    id: 'dashboard-tour',
    titleEn: 'Dashboard & Navigation',
    titleHi: 'डैशबोर्ड और नेविगेशन (Dashboard Tour)',
    categoryEn: 'Getting Started',
    categoryHi: 'शुरुआत करें',
    badge: 'Guide',
    summaryEn: 'Complete tour of the enterprise dashboard, navigation menu, profile setup, and essential platform settings.',
    summaryHi: 'एंटरप्राइज डैशबोर्ड, नेविगेशन मेनू, प्रोफाइल सेटअप और महत्वपूर्ण सेटिंग्स का पूर्ण विवरण।',

    overviewEn: `Once logged in, you will arrive at your personal command center. The Pi Business Market dashboard is designed for high-density information management, allowing you to monitor orders, inventory, messages, and earnings at a glance. Whether you are a shopper or a merchant, the sidebar provides quick access to specialized modules like the Catalog, Fulfillment Center, and CRM.`,
    overviewHi: `लॉगिन करने के बाद, आप अपने पर्सनल कमांड सेंटर पर पहुंच जाएंगे। डैशबोर्ड को इस तरह डिजाइन किया गया है कि आप एक नज़र में ऑर्डर, इन्वेंटरी और कमाई देख सकें। चाहे आप खरीदार हों या मर्चेंट, साइडबार आपको सभी महत्वपूर्ण मॉड्यूल्स तक तुरंत पहुंचाता है।`,

    purposeEn: `The purpose of this tour is to familiarize users with the layout and interaction patterns of the portal. It covers how to switch between views, manage notifications, and customize your profile settings for better business visibility.`,
    purposeHi: `इस टूर का उद्देश्य उपयोगकर्ताओं को पोर्टल के लेआउट और कार्यप्रणाली से परिचित कराना है।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Global Sidebar Navigation',
        titleHi: 'ग्लोबल साइडबार नेविगेशन',
        descriptionEn: 'Use the left sidebar to jump between Catalog, Warehouses, CRM, Inbox, and Analytics. [Screenshot: Sidebar Menu]',
        descriptionHi: 'कैटलॉग, वेयरहाउस, CRM और एनालिटिक्स के बीच जाने के लिए बाएं साइडबार का उपयोग करें।'
      },
      {
        stepNumber: 2,
        titleEn: 'Summary Cards',
        titleHi: 'समरी कार्ड्स (Overview)',
        descriptionEn: 'The top of the dashboard shows real-time stats: Active Orders, Pi Balance, and Pending Shipments.',
        descriptionHi: 'डैशबोर्ड के शीर्ष पर रियल-टाइम आंकड़े दिखते हैं: सक्रिय ऑर्डर, Pi बैलेंस और पेंडिंग शिपमेंट।'
      },
      {
        stepNumber: 3,
        titleEn: 'Quick Action Center',
        titleHi: 'क्विक एक्शन सेंटर',
        descriptionEn: 'Use the "Create Store" or "Add Product" buttons located in the header for rapid task execution.',
        descriptionHi: 'हेडर में स्थित "Create Store" या "Add Product" बटन का उपयोग त्वरित कार्य के लिए करें।'
      },
      {
        stepNumber: 4,
        titleEn: 'Settings & Profile',
        titleHi: 'सेटिंग्स और प्रोफाइल',
        descriptionEn: 'Click your avatar to access Business Settings, Theme Toggle, and KYC status. [Screenshot: Profile Dropdown]',
        descriptionHi: 'बिज़नेस सेटिंग्स, थीम टॉगल और KYC स्टेटस के लिए अपनी प्रोफाइल फोटो पर क्लिक करें।'
      }
    ],

    benefitsEn: [
      'High-visibility metrics for informed business decisions.',
      'Responsive layout optimized for both mobile browser and desktop.',
      'Unified notification system for orders, messages, and escrow updates.',
      'One-click role switching for multi-faceted users.'
    ],
    benefitsHi: [
      'व्यापारिक निर्णय लेने के लिए स्पष्ट और सटीक डेटा।',
      'मोबाइल और डेस्कटॉप दोनों के लिए अनुकूलित (Responsive) लेआउट।',
      'ऑर्डर और संदेशों के लिए एकीकृत नोटिफिकेशन सिस्टम।',
      'बहुमुखी उपयोगकर्ताओं के लिए आसान रोल स्विचिंग।'
    ],

    tipsEn: [
      'Use the Search bar at the top to find any specific order ID or customer name instantly.',
      'Customize your "Business Dashboard" layout by pinning your most-used modules to the top.',
      'Switch to Dark Mode for better eye comfort during long management sessions.'
    ],
    tipsHi: [
      'किसी भी ऑर्डर ID या ग्राहक का नाम खोजने के लिए शीर्ष पर स्थित सर्च बार का उपयोग करें।',
      'बेहतर अनुभव के लिए डार्क मोड (Dark Mode) का उपयोग करें।'
    ],

    bestPracticesEn: [
      'Check the "Notifications" bell daily to ensure no orders are awaiting fulfillment.',
      'Keep your Business Profile bio descriptive and professional to attract more B2B partners.',
      'Regularly review the "Analytics" tab to identify your best-performing products.'
    ],
    bestPracticesHi: [
      'यह सुनिश्चित करने के लिए कि कोई ऑर्डर पेंडिंग न हो, रोजाना नोटिफिकेशन चेक करें।',
      'अधिक बिजनेस पार्टनर्स को आकर्षित करने के लिए अपनी प्रोफाइल को प्रोफेशनल रखें।'
    ],

    notesEn: [
      'Performance: The dashboard caches data locally for speed; use the refresh button to pull the latest blockchain state.',
      'Customization: Some layout features are restricted to "Enterprise" verified accounts.',
      'Help: Click the "?" icon in any module for contextual help tips.'
    ],
    notesHi: [
      'परफॉरमेंस: डैशबोर्ड डेटा को तेजी के लिए लोकली कैश करता है; लेटेस्ट डेटा के लिए रिफ्रेश बटन दबाएं।'
    ],

    faqs: [
      {
        questionEn: 'How do I change the language of the dashboard?',
        questionHi: 'मैं डैशबोर्ड की भाषा कैसे बदल सकता हूं?',
        answerEn: 'Go to Settings > Display and select between English and Easy Hindi.',
        answerHi: 'सेटिंग्स > डिस्प्ले पर जाएं और अंग्रेजी या हिंदी में से चुनें।'
      },
      {
        questionEn: 'Can I hide my revenue stats on the dashboard?',
        questionHi: 'क्या मैं डैशबोर्ड पर अपनी कमाई छुपा सकता हूं?',
        answerEn: 'Yes, use the "Privacy Mode" toggle (eye icon) to mask sensitive financial figures.',
        answerHi: 'हाँ, संवेदनशील वित्तीय आंकड़ों को छुपाने के लिए "Privacy Mode" (आंख वाला आइकन) का उपयोग करें।'
      }
    ]
  },

  // ==========================================
  // 8. GETTING STARTED - MERCHANT QUICKSTART
  // ==========================================
  {
    id: 'merchant-quickstart',
    titleEn: 'Merchant Quickstart',
    titleHi: 'मर्चेंट क्विकस्टार्ट (Seller Guide)',
    categoryEn: 'Getting Started',
    categoryHi: 'शुरुआत करें',
    badge: 'New Seller',
    summaryEn: 'Complete onboarding for new sellers: Business creation, store setup, listing your first product, and accepting Pi payments.',
    summaryHi: 'नए विक्रेताओं के लिए पूर्ण ऑनबोर्डिंग: बिज़नेस निर्माण, स्टोर सेटअप, पहला उत्पाद लिस्ट करना और Pi पेमेंट्स स्वीकार करना।',

    overviewEn: `Ready to start selling for Pi? The Merchant Quickstart guide takes you from an empty profile to a fully operational Web3 storefront. You will learn how to define your business entity, configure your first digital store, and list products with accurate pricing and shipping rules. Once your first product is live, you can start receiving Pi tokens into your secure escrow vault.`,
    overviewHi: `क्या आप Pi के बदले सामान बेचने के लिए तैयार हैं? यह क्विकस्टार्ट गाइड आपको एक खाली प्रोफाइल से पूर्णतः सक्रिय Web3 स्टोर बनाने तक ले जाएगी। आप सीखेंगे कि अपना बिज़नेस कैसे परिभाषित करें, स्टोर सेटअप करें और सही कीमत के साथ उत्पाद लिस्ट करें।`,

    purposeEn: `The purpose of this guide is to minimize the "time-to-first-sale" for new merchants. It streamlines the complex process of setting up a decentralized business into four easy milestones.`,
    purposeHi: `इस गाइड का उद्देश्य नए व्यापारियों के लिए स्टोर सेटअप प्रक्रिया को सरल और तेज बनाना है।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Create Business Entity',
        titleHi: 'बिज़नेस एंटिटी बनाएं',
        descriptionEn: 'Navigate to Business Profile and enter your Legal Name, Logo, and Category. [Screenshot: Business Form]',
        descriptionHi: 'बिज़नेस प्रोफाइल पर जाएं और अपना नाम, लोगो और कैटेगरी दर्ज करें।'
      },
      {
        stepNumber: 2,
        titleEn: 'Launch Your First Store',
        titleHi: 'अपना पहला स्टोर लॉन्च करें',
        descriptionEn: 'Under "Stores", click "New Store". Define your store name, currency (Pi), and operating hours.',
        descriptionHi: '"Stores" के तहत "New Store" पर क्लिक करें। स्टोर का नाम और ऑपरेटिंग समय तय करें।'
      },
      {
        stepNumber: 3,
        titleEn: 'Add First Product',
        titleHi: 'पहला उत्पाद जोड़ें',
        descriptionEn: 'Enter Product Name, Description, Price in Pi, and upload high-quality images. [Screenshot: Product Editor]',
        descriptionHi: 'उत्पाद का नाम, विवरण, Pi में कीमत दर्ज करें और स्पष्ट फोटो अपलोड करें।'
      },
      {
        stepNumber: 4,
        titleEn: 'Configure Fulfillment',
        titleHi: 'फुलफिलमेंट कॉन्फ़िगर करें',
        descriptionEn: 'Link your store to a warehouse and set your shipping regions and estimated delivery times.',
        descriptionHi: 'अपने स्टोर को वेयरहाउस से लिंक करें और शिपिंग क्षेत्र एवं डिलीवरी का समय तय करें।'
      }
    ],

    benefitsEn: [
      'Global exposure to millions of Pi Pioneers looking to spend their tokens.',
      'Direct-to-wallet settlements with zero intermediary bank fees.',
      'Professional enterprise tools for stock and order management.',
      'Verified Merchant Badge for increased customer trust.'
    ],
    benefitsHi: [
      'लाखों Pi Pioneers तक वैश्विक पहुंच जो अपनी टोकन खर्च करना चाहते हैं।',
      'बिना किसी बैंकिंग शुल्क के सीधे वॉलेट में सेटलमेंट।',
      'स्टॉक और ऑर्डर मैनेजमेंट के लिए प्रोफेशनल एंटरप्राइज टूल्स।',
      'ग्राहकों का भरोसा बढ़ाने के लिए "Verified Merchant Badge"।'
    ],

    tipsEn: [
      'Start with 2-3 high-demand items to test your fulfillment workflow before scaling.',
      'Use clear, keyword-rich product titles to improve search visibility within the Pi Browser.',
      'Offer a small "First Purchase" discount in Pi to encourage early reviews.'
    ],
    tipsHi: [
      'शुरुआत में 2-3 मुख्य उत्पादों के साथ टेस्टिंग करें।',
      'सर्च में ऊपर आने के लिए उत्पादों के स्पष्ट और सटीक नाम रखें।'
    ],

    bestPracticesEn: [
      'Provide accurate shipping estimates—late deliveries can lead to escrow disputes.',
      'Respond quickly to customer inquiries in the "Messages" tab to maintain high ratings.',
      'Keep your stock levels updated to avoid rejecting orders and lowering your score.'
    ],
    bestPracticesHi: [
      'सटीक शिपिंग समय बताएं—देरी से एस्क्रौ विवाद (Dispute) हो सकता है।',
      'अच्छी रेटिंग के लिए ग्राहकों के सवालों का तुरंत जवाब दें।'
    ],

    notesEn: [
      'Escrow Safety: Your earnings are held in escrow for 7-14 days (depending on your trust score) to ensure buyer satisfaction.',
      'Verification: New stores undergo a quick automated check to prevent spam listings.',
      'Fees: Pi Business Market currently charges 0% platform commission for early adopters.'
    ],
    notesHi: [
      'सुरक्षा: खरीदार की संतुष्टि सुनिश्चित करने के लिए आपकी कमाई 7-14 दिनों तक एस्क्रौ में रह सकती है।',
      'फीस: शुरुआती विक्रेताओं के लिए अभी कोई प्लेटफॉर्म कमीशन नहीं है (0% Fees)।'
    ],

    faqs: [
      {
        questionEn: 'How much Pi should I charge for my products?',
        questionHi: 'मुझे अपने प्रोडक्ट्स के लिए कितनी Pi मांगनी चाहिए?',
        answerEn: 'We recommend looking at current marketplace averages or using our "USD Reference Tool" to set fair competitive pricing.',
        answerHi: 'हम मार्केटप्लेस के औसत रेट देखने या हमारे "USD Reference Tool" का उपयोग करने की सलाह देते हैं।'
      },
      {
        questionEn: 'What if I need to take a break from selling?',
        questionHi: 'अगर मुझे बिक्री से ब्रेक लेना हो तो?',
        answerEn: 'Simply toggle your store to "Vacation Mode" in settings to temporarily hide your listings and prevent new orders.',
        answerHi: 'सेटिंग्स में "Vacation Mode" ऑन कर दें, इससे आपके प्रोडक्ट्स अस्थायी रूप से छुप जाएंगे।'
      }
    ]
  },

  // ==========================================
  // 9. MODULE REFERENCE - PERSONAL DASHBOARD
  // ==========================================
  {
    id: 'personal-dashboard-manual',
    titleEn: 'Personal Dashboard Manual',
    titleHi: 'पर्सनल डैशबोर्ड मैनुअल (User Dashboard)',
    categoryEn: 'Module Reference',
    categoryHi: 'मॉड्यूल संदर्भ',
    badge: 'Core',
    summaryEn: 'Guide to your primary overview: Tracking active orders, wallet balance, recent activity, and personal shopping history.',
    summaryHi: 'आपकी प्राथमिक जानकारी के लिए गाइड: सक्रिय ऑर्डर, वॉलेट बैलेंस और व्यक्तिगत खरीदारी इतिहास को ट्रैक करें।',

    overviewEn: `The Personal Dashboard is the home screen for every Pioneer. It provides a non-commercial view focused on your activities as a buyer or individual participant. Here, you can monitor the status of your Pi payments in escrow, view your delivery progress, and access your quick-links for the most used marketplace features.`,
    overviewHi: `पर्सनल डैशबोर्ड हर Pioneer के लिए होम स्क्रीन है। यह एक व्यक्तिगत दृष्टिकोण प्रदान करता है जो आपकी खरीदारी और व्यक्तिगत भागीदारी पर केंद्रित है। यहाँ आप एस्क्रौ में अपने Pi पेमेंट्स की स्थिति और अपनी डिलीवरी की प्रगति देख सकते हैं।`,

    purposeEn: `To provide a consolidated view of personal shopping activity and wallet health, ensuring buyers can track their funds and orders without needing to navigate through merchant tools.`,
    purposeHi: `व्यक्तिगत खरीदारी और वॉलेट की स्थिति का एक एकीकृत दृश्य प्रदान करना, ताकि खरीदार अपने फंड और ऑर्डर को आसानी से ट्रैक कर सकें।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Wallet Overview',
        titleHi: 'वॉलेट ओवरव्यू',
        descriptionEn: 'The top left card shows your "Marketplace Balance" which is currently available for shopping or locked in escrow.',
        descriptionHi: 'शीर्ष बाएं कार्ड में आपका "मार्केटप्लेस बैलेंस" दिखता है जो खरीदारी के लिए उपलब्ध है या एस्क्रौ में लॉक है।'
      },
      {
        stepNumber: 2,
        titleEn: 'Active Order Tracking',
        titleHi: 'सक्रिय ऑर्डर ट्रैकिंग',
        descriptionEn: 'The central feed lists all orders currently in "Processing" or "Shipped" status with live status badges.',
        descriptionHi: 'सेंट्रल फीड उन सभी ऑर्डर्स को सूचीबद्ध करता है जो वर्तमान में "प्रोसेसिंग" या "शिप्ड" स्थिति में हैं।'
      },
      {
        stepNumber: 3,
        titleEn: 'Recommended For You',
        titleHi: 'आपके लिए सुझाव',
        descriptionEn: 'AI-driven product suggestions based on your browsing history and previous Pi purchases.',
        descriptionHi: 'आपके पिछले खरीदारी इतिहास के आधार पर AI द्वारा सुझाए गए प्रोडक्ट्स।'
      }
    ],

    benefitsEn: [
      'Instant visibility into your spending and order status.',
      'One-click navigation to the global product catalog.',
      'Direct access to order dispute tools and escrow release buttons.',
      'Mobile-optimized layout for tracking on the go.'
    ],
    benefitsHi: [
      'अपने खर्च और ऑर्डर की स्थिति की तुरंत जानकारी।',
      'वैश्विक प्रोडक्ट कैटलॉग पर जाने के लिए वन-क्लिक नेविगेशन।',
      'ऑर्डर विवाद (Dispute) टूल्स और एस्क्रौ रिलीज बटन तक सीधी पहुंच।',
      'चलते-फिरते ट्रैकिंग के लिए मोबाइल-अनुकूलित लेआउट।'
    ],

    tipsEn: [
      'Pin the "Order Tracker" card to the top if you are waiting for multiple shipments.',
      'Check the "Recent Activity" log to verify if your escrow payments were successfully confirmed on the Pi Blockchain.',
      'Use the "Quick Reorder" button for items you purchase frequently.'
    ],
    tipsHi: [
      'यदि आप कई शिपमेंट की प्रतीक्षा कर रहे हैं, तो "ऑर्डर ट्रैकर" कार्ड को ऊपर पिन करें।',
      'यह सत्यापित करने के लिए कि आपके पेमेंट ब्लॉकचेन पर कन्फर्म हुए हैं या नहीं, "Recent Activity" लॉग देखें।'
    ],

    bestPracticesEn: [
      'Always release escrow as soon as you receive and verify your product to help merchants get paid faster.',
      'Update your primary shipping address in the Dashboard Profile to avoid errors during checkout.',
      'Review your "Unread Messages" regularly to coordinate with sellers about custom orders.'
    ],
    bestPracticesHi: [
      'मर्चेंट को समय पर भुगतान दिलाने के लिए उत्पाद प्राप्त होते ही एस्क्रौ रिलीज करें।',
      'चेकआउट के दौरान त्रुटियों से बचने के लिए डैशबोर्ड प्रोफाइल में अपना मुख्य शिपिंग पता अपडेट रखें।'
    ],

    notesEn: [
      'Privacy: Your personal dashboard is private and cannot be viewed by other users or merchants.',
      'Refresh Rate: Data refreshes every 60 seconds automatically, or manually via the "Sync" icon.',
      'Currency: All figures are displayed in Pi (π) by default.'
    ],
    notesHi: [
      'गोपनीयता: आपका पर्सनल डैशबोर्ड प्राइवेट है और इसे अन्य यूजर्स या मर्चेंट्स नहीं देख सकते।'
    ],

    faqs: [
      {
        questionEn: 'How do I see my old orders?',
        questionHi: 'मैं अपने पुराने ऑर्डर कैसे देख सकता हूं?',
        answerEn: 'Click on "View All History" in the Orders card to see your complete transaction archive.',
        answerHi: 'अपना पूरा लेनदेन इतिहास देखने के लिए ऑर्डर्स कार्ड में "View All History" पर क्लिक करें।'
      },
      {
        questionEn: 'Where can I find my invoice?',
        questionHi: 'मुझे अपना इनवॉइस (बिल) कहां मिलेगा?',
        answerEn: 'Open any specific order detail and click the "Download PDF Invoice" button in the header.',
        answerHi: 'किसी भी ऑर्डर डिटेल्स को खोलें और हेडर में "Download PDF Invoice" बटन पर क्लिक करें।'
      }
    ]
  },

  // ==========================================
  // 10. MODULE REFERENCE - BUSINESS DASHBOARD
  // ==========================================
  {
    id: 'business-dashboard-manual',
    titleEn: 'Business Command Center',
    titleHi: 'बिज़नेस कमांड सेंटर (Merchant Dashboard)',
    categoryEn: 'Module Reference',
    categoryHi: 'मॉड्यूल संदर्भ',
    badge: 'Enterprise',
    summaryEn: 'Management hub for sellers: Revenue charts, order fulfillment, team management, and store performance analytics.',
    summaryHi: 'विक्रेताओं के लिए मैनेजमेंट हब: राजस्व चार्ट, ऑर्डर फुलफिलमेंट, टीम मैनेजमेंट और एनालिटिक्स।',

    overviewEn: `The Business Command Center is the specialized workspace for verified Merchants. It replaces the simple shopping view with professional-grade ERP and CRM tools. Here, you manage the "Business Entity" which can house multiple stores, warehouses, and employees. This module provides a 360-degree view of your commercial operations within the Pi Network.`,
    overviewHi: `बिज़नेस कमांड सेंटर सत्यापित मर्चेंट्स के लिए एक विशेष कार्यक्षेत्र है। यह प्रोफेशनल ERP और CRM टूल्स के साथ व्यावसायिक संचालन का 360-डिग्री दृश्य प्रदान करता है। यहाँ आप अपनी बिज़नेस एंटिटी, स्टोर्स और कर्मचारियों को प्रबंधित करते हैं।`,

    purposeEn: `To empower businesses with data-driven insights and efficient operational controls, enabling them to scale their Pi-based commerce globally.`,
    purposeHi: `व्यवसायों को डेटा-आधारित अंतर्दृष्टि और कुशल नियंत्रणों के साथ सशक्त बनाना, ताकि वे अपने Pi-आधारित व्यापार को वैश्विक स्तर पर बढ़ा सकें।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Revenue Analytics',
        titleHi: 'राजस्व एनालिटिक्स',
        descriptionEn: 'The primary chart shows your total Pi revenue over 7/30/90 days with growth trend lines.',
        descriptionHi: 'मुख्य चार्ट 7/30/90 दिनों में आपकी कुल Pi आय और विकास की प्रवृत्ति दिखाता है।'
      },
      {
        stepNumber: 2,
        titleEn: 'Fulfillment Queue',
        titleHi: 'फुलफिलमेंट कतार',
        descriptionEn: 'A high-priority list of orders that need to be picked, packed, or shipped immediately.',
        descriptionHi: 'उन ऑर्डर्स की सूची जिन्हें तुरंत पैक या शिप करने की आवश्यकता है।'
      },
      {
        stepNumber: 3,
        titleEn: 'Inventory Heatmap',
        titleHi: 'इन्वेंटरी हीटमैप',
        descriptionEn: 'Visual indicators of low-stock items across all your connected warehouses.',
        descriptionHi: 'आपके सभी वेयरहाउस में कम स्टॉक वाले उत्पादों के विजुअल इंडिकेटर्स।'
      }
    ],

    benefitsEn: [
      'Consolidated management of multiple retail stores under one business ID.',
      'Real-time Pi settlements tracking for financial transparency.',
      'Advanced customer relationship management (CRM) for repeat buyer engagement.',
      'Automated stock alerts to prevent overselling.'
    ],
    benefitsHi: [
      'एक ही बिज़नेस ID के तहत कई रिटेल स्टोर्स का एकीकृत प्रबंधन।',
      'वित्तीय पारदर्शिता के लिए रियल-टाइम Pi सेटलमेंट ट्रैकिंग।',
      'पुराने ग्राहकों को जोड़े रखने के लिए उन्नत CRM सिस्टम।',
      'ओवरसेलिंग (Overselling) रोकने के लिए ऑटोमेटेड स्टॉक अलर्ट।'
    ],

    tipsEn: [
      'Use the "Quick Ship" button for standard orders to generate tracking IDs automatically.',
      'Export your sales data to CSV for local tax reporting and accounting audits.',
      'Set up "Staff Roles" to delegate inventory management to your team without sharing your master passphrase.'
    ],
    tipsHi: [
      'ट्रैकिंग ID स्वचालित रूप से जनरेट करने के लिए "Quick Ship" बटन का उपयोग करें।',
      'अकाउंटिंग और टैक्स रिपोर्ट के लिए अपना बिक्री डेटा CSV में एक्सपोर्ट करें।'
    ],

    bestPracticesEn: [
      'Process "Urgent" flagged orders within 24 hours to maintain a Platinum trust score.',
      'Regularly update your Business Profile description to reflect holiday hours or special promotions.',
      'Monitor the "Return Rate" metric to identify quality issues in specific product batches.'
    ],
    bestPracticesHi: [
      'प्लैटिनम ट्रस्ट स्कोर बनाए रखने के लिए "Urgent" ऑर्डर को 24 घंटे के भीतर प्रोसेस करें।',
      'विशेष प्रमोशन या छुट्टियों की जानकारी देने के लिए अपनी बिज़नेस प्रोफाइल अपडेट रखें।'
    ],

    notesEn: [
      'Access: This module is only accessible after completing the "Business Onboarding" flow.',
      'Security: All sensitive actions (like fund withdrawal) require a secondary 2FA or Pi Wallet signature.',
      'Compatibility: Optimized for tablets and desktop browsers for data-heavy management.'
    ],
    notesHi: [
      'सुरक्षा: फंड विथड्रॉल जैसे संवेदनशील कार्यों के लिए Pi वॉलेट सिग्नेचर की आवश्यकता होती है।'
    ],

    faqs: [
      {
        questionEn: 'How do I add a team member to my business?',
        questionHi: 'मैं अपने बिज़नेस में टीम मेंबर कैसे जोड़ सकता हूं?',
        answerEn: 'Go to Business Profile > Team Management and invite them using their Pi Username.',
        answerHi: 'Business Profile > Team Management पर जाएं और उनके Pi यूजरनेम का उपयोग करके उन्हें आमंत्रित करें।'
      },
      {
        questionEn: 'Can I manage multiple businesses with one Pi account?',
        questionHi: 'क्या मैं एक Pi अकाउंट से कई बिज़नेस मैनेज कर सकता हूं?',
        answerEn: 'Currently, one Pi account is linked to one primary Business Entity. You can create multiple stores under that entity.',
        answerHi: 'वर्तमान में, एक Pi अकाउंट एक मुख्य बिज़नेस एंटिटी से जुड़ा होता है, जिसके तहत आप कई स्टोर्स बना सकते हैं।'
      }
    ]
  },

  // ==========================================
  // 11. MODULE REFERENCE - STORE & PRODUCT
  // ==========================================
  {
    id: 'store-product-management',
    titleEn: 'Store & Product Management',
    titleHi: 'स्टोर और प्रोडक्ट मैनेजमेंट (Store Guide)',
    categoryEn: 'Module Reference',
    categoryHi: 'मॉड्यूल संदर्भ',
    badge: 'Inventory',
    summaryEn: 'Complete guide to launching digital storefronts, listing products, setting prices in Pi, and managing category hierarchies.',
    summaryHi: 'डिजिटल स्टोर लॉन्च करने, प्रोडक्ट लिस्ट करने, Pi में कीमत तय करने और कैटेगरी मैनेजमेंट के लिए पूर्ण गाइड।',

    overviewEn: `The Store & Product module is where you define your brand's presence. You can create multiple virtual "Stores" (e.g., Electronics Store, Fashion Boutique) under one business. Each store holds its own catalog of products. The Product Manager allows for rich descriptions, multiple high-res images, and dynamic pricing linked to current Pi Network market trends.`,
    overviewHi: `स्टोर और प्रोडक्ट मॉड्यूल वह जगह है जहाँ आप अपने ब्रांड की पहचान बनाते हैं। आप एक बिज़नेस के तहत कई वर्चुअल "स्टोर्स" बना सकते हैं। प्रोडक्ट मैनेजर आपको विस्तृत विवरण, कई हाई-रिज़ॉल्यूशन फ़ोटो और Pi नेटवर्क के अनुसार डायनामिक प्राइसिंग सेट करने की सुविधा देता है।`,

    purposeEn: `To simplify the cataloging process and ensure that product data is structured for optimal searchability and accurate fulfillment during the checkout process.`,
    purposeHi: `कैटलॉगिंग प्रक्रिया को सरल बनाना और यह सुनिश्चित करना कि प्रोडक्ट डेटा सर्च और चेकआउट के लिए सही ढंग से व्यवस्थित हो।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Store Configuration',
        titleHi: 'स्टोर कॉन्फ़िगरेशन',
        descriptionEn: 'Set your store name, localized banner, and define which warehouses will ship products for this specific store.',
        descriptionHi: 'स्टोर का नाम, बैनर सेट करें और तय करें कि कौन सा वेयरहाउस इस स्टोर के लिए सामान शिप करेगा।'
      },
      {
        stepNumber: 2,
        titleEn: 'Rich Product Listing',
        titleHi: 'विस्तृत प्रोडक्ट लिस्टिंग',
        descriptionEn: 'Upload up to 5 images per product. Use the built-in editor to format your description with bold text and lists.',
        descriptionHi: 'प्रति प्रोडक्ट 5 फोटो तक अपलोड करें। बोल्ड टेक्स्ट और लिस्ट के साथ विवरण लिखने के लिए एडिटर का उपयोग करें।'
      },
      {
        stepNumber: 3,
        titleEn: 'Pricing & Stock',
        titleHi: 'प्राइसिंग और स्टॉक',
        descriptionEn: 'Set your price in Pi (π). Enter initial stock levels and set low-stock alert thresholds.',
        descriptionHi: 'Pi (π) में कीमत तय करें। शुरुआती स्टॉक दर्ज करें और लो-स्टॉक अलर्ट सेट करें।'
      }
    ],

    benefitsEn: [
      'Multi-store capability for niche branding.',
      'SEO-optimized product pages for better visibility in the Pi Browser.',
      'Automated category mapping for faster customer browsing.',
      'One-click "Clone Product" feature for similar inventory items.'
    ],
    benefitsHi: [
      'अलग-अलग ब्रांडिंग के लिए मल्टी-स्टोर क्षमता।',
      'Pi Browser में बेहतर दृश्यता के लिए SEO-अनुकूलित प्रोडक्ट पेज।',
      'तेजी से ब्राउज़िंग के लिए ऑटोमेटेड कैटेगरी मैपिंग।',
      'समान इन्वेंटरी के लिए वन-क्लिक "Clone Product" फीचर।'
    ],

    tipsEn: [
      'Use high-contrast images with clean backgrounds to increase your click-through rate.',
      'Include technical specifications in a separate "Tech Specs" table within the product description.',
      'Offer "Bundle Deals" by creating a single product listing that includes multiple items at a discounted Pi rate.'
    ],
    tipsHi: [
      'क्लिक बढ़ाने के लिए साफ बैकग्राउंड वाली हाई-कॉन्ट्रास्ट तस्वीरों का उपयोग करें।',
      'डिस्काउंट रेट पर कई चीजें एक साथ बेचने के लिए "Bundle Deals" ऑफर करें।'
    ],

    bestPracticesEn: [
      'Audit your product prices weekly to ensure they stay competitive within the Pi ecosystem.',
      'Clearly state any shipping restrictions (e.g., "No international shipping for batteries") in the product summary.',
      'Use the "Featured" toggle for your best-selling items to pin them to the top of your store home.'
    ],
    bestPracticesHi: [
      'प्रतियोगी बने रहने के लिए साप्ताहिक रूप से अपनी कीमतों की समीक्षा करें।',
      'प्रोडक्ट समरी में शिपिंग प्रतिबंधों (यदि कोई हो) को स्पष्ट रूप से लिखें।'
    ],

    notesEn: [
      'Image Limits: Maximum 2MB per image; recommended resolution 1024x1024 (1:1 aspect ratio).',
      'Categories: If your category is missing, contact support to have a new industry node added.',
      'Deactivation: Do not delete products; use the "Archive" feature to preserve historical sales data.'
    ],
    notesHi: [
      'फोटो सीमा: प्रति फोटो अधिकतम 2MB; 1024x1024 रेसोल्यूशन की सलाह दी जाती है।'
    ],

    faqs: [
      {
        questionEn: 'How many products can I list?',
        questionHi: 'मैं कितने प्रोडक्ट्स लिस्ट कर सकता हूं?',
        answerEn: 'Standard accounts can list up to 50 active products. Enterprise accounts have unlimited listing capabilities.',
        answerHi: 'स्टैंडर्ड अकाउंट्स 50 तक प्रोडक्ट्स लिस्ट कर सकते हैं। एंटरप्राइज अकाउंट्स के लिए कोई सीमा नहीं है।'
      },
      {
        questionEn: 'Can I sell digital goods (e.g., eBooks)?',
        questionHi: 'क्या मैं डिजिटल सामान (जैसे ई-बुक्स) बेच सकता हूं?',
        answerEn: 'Yes. Select "Digital Delivery" in the fulfillment settings to skip warehouse linking.',
        answerHi: 'हाँ, वेयरहाउस लिंकिंग छोड़ने के लिए फुलफिलमेंट सेटिंग्स में "Digital Delivery" चुनें।'
      }
    ]
  },

  // ==========================================
  // 12. MODULE REFERENCE - FULFILLMENT & CRM
  // ==========================================
  {
    id: 'fulfillment-crm-manual',
    titleEn: 'Fulfillment & CRM',
    titleHi: 'फुलफिलमेंट और CRM (Operations Guide)',
    categoryEn: 'Module Reference',
    categoryHi: 'मॉड्यूल संदर्भ',
    badge: 'Operations',
    summaryEn: 'The core of your operations: Processing orders, handling shipments, managing customer profiles, and dispute resolution.',
    summaryHi: 'आपके संचालन का मुख्य भाग: ऑर्डर प्रोसेसिंग, शिपमेंट हैंडलिंग और ग्राहक संबंधों का प्रबंधन।',

    overviewEn: `The Fulfillment module manages the lifecycle of an order from "Pending" to "Delivered." The CRM (Customer Relationship Management) engine works alongside it, building detailed profiles for every shopper who interacts with your store. This integrated approach allows you to provide personalized support and reward loyal customers who pay in Pi.`,
    overviewHi: `फुलफिलमेंट मॉड्यूल ऑर्डर के जीवनचक्र (Pending से Delivered तक) को मैनेज करता है। CRM इंजन हर खरीदार की प्रोफाइल बनाता है, जिससे आप उन्हें व्यक्तिगत सहायता और इनाम दे सकते हैं।`,

    purposeEn: `To ensure zero-error delivery cycles and build long-term trust through professional communication and transparent order tracking.`,
    purposeHi: `प्रोफेशनल कम्युनिकेशन और पारदर्शी ट्रैकिंग के माध्यम से शून्य-त्रुटि डिलीवरी और दीर्घकालिक विश्वास सुनिश्चित करना।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Order Validation',
        titleHi: 'ऑर्डर सत्यापन',
        descriptionEn: 'Verify the buyer\'s Pi escrow payment is "Confirmed" before preparing the shipment.',
        descriptionHi: 'शिपमेंट तैयार करने से पहले सत्यापित करें कि खरीदार का Pi एस्क्रौ पेमेंट "Confirmed" है।'
      },
      {
        stepNumber: 2,
        titleEn: 'Pick & Pack Workflow',
        titleHi: 'पिक और पैक वर्कफ़्लो',
        descriptionEn: 'Generate packing slips. Mark items as "Ready for Pickup" to notify the courier partner.',
        descriptionHi: 'पैकिंग स्लिप जनरेट करें। कूरियर पार्टनर को सूचित करने के लिए "Ready for Pickup" मार्क करें।'
      },
      {
        stepNumber: 3,
        titleEn: 'CRM Engagement',
        titleHi: 'CRM एंगेजमेंट',
        descriptionEn: 'Use the CRM 360 view to see a customer\'s purchase history and lifetime Pi spend.',
        descriptionHi: 'ग्राहक का पिछला इतिहास और कुल Pi खर्च देखने के लिए CRM 360 व्यू का उपयोग करें।'
      }
    ],

    benefitsEn: [
      'Unified view of all customer interactions (Chat, Orders, Disputes).',
      'Bulk fulfillment tools for high-volume merchants.',
      'Automated tracking number synchronization with global carriers.',
      'Tiered customer groups (Gold/Platinum) for exclusive Pi-discounts.'
    ],
    benefitsHi: [
      'सभी ग्राहक इंटरैक्शन (चैट, ऑर्डर, विवाद) का एकीकृत दृश्य।',
      'ज्यादा ऑर्डर्स के लिए बल्क फुलफिलमेंट टूल्स।',
      'ग्लोबल कूरियर्स के साथ ऑटोमेटेड ट्रैकिंग नंबर सिंक।',
      'विशेष डिस्काउंट के लिए अलग-अलग ग्राहक श्रेणियां (Gold/Platinum)।'
    ],

    tipsEn: [
      'Always include a "Thank You" message in the digital chat after an order is placed.',
      'Use the CRM filters to find "Lapsed Customers" and send them a custom Pi-coupon to win them back.',
      'Take photos of the packed parcel before shipping to protect yourself during escrow disputes.'
    ],
    tipsHi: [
      'ऑर्डर मिलने के बाद डिजिटल चैट में हमेशा "धन्यवाद" संदेश भेजें।',
      'पुराने ग्राहकों को वापस लाने के लिए उन्हें विशेष Pi-कूपन भेजें।'
    ],

    bestPracticesEn: [
      'Acknowledge every order within 4 hours, even if it won\'t ship until the next day.',
      'Keep your internal "Staff Notes" in the CRM updated to share customer context with your team.',
      'Proactively notify customers if a shipment is delayed—don\'t wait for them to ask.'
    ],
    bestPracticesHi: [
      'हर ऑर्डर को 4 घंटे के भीतर स्वीकार (Acknowledge) करें।',
      'शिपमेंट में देरी होने पर ग्राहकों को खुद सूचित करें—उनके पूछने का इंतज़ार न करें।'
    ],

    notesEn: [
      'Disputes: If a buyer opens a dispute, the Pi funds remain locked in escrow until resolved by our arbitration team.',
      'Labels: Ensure thermal printers are calibrated for our standard 4x6 inch shipping labels.',
      'Privacy: Never share customer phone numbers or addresses outside of the platform.'
    ],
    notesHi: [
      'विवाद: यदि कोई खरीदार विवाद (Dispute) शुरू करता है, तो फंड एस्क्रौ में तब तक लॉक रहता है जब तक समाधान न हो जाए।'
    ],

    faqs: [
      {
        questionEn: 'How do I issue a refund in Pi?',
        questionHi: 'मैं Pi में रिफंड कैसे दे सकता हूं?',
        answerEn: 'Go to the Order Details and click "Initiate Refund". Funds will return to the buyer\'s wallet minus blockchain gas fees.',
        answerHi: 'ऑर्डर डिटेल्स पर जाएं और "Initiate Refund" पर क्लिक करें। फंड खरीदार के वॉलेट में वापस चला जाएगा।'
      },
      {
        questionEn: 'What is the "Customer Loyalty Score"?',
        questionHi: '"Customer Loyalty Score" क्या है?',
        answerEn: 'It is an automated metric (1-100) based on successful completions and positive reviews. High scores signify low-risk buyers.',
        answerHi: 'यह सफल लेनदेन और समीक्षाओं पर आधारित स्कोर (1-100) है। उच्च स्कोर कम जोखिम वाले खरीदारों को दर्शाता है।'
      }
    ]
  },

  // ==========================================
  // 13. MODULE REFERENCE - INVENTORY & ANALYTICS
  // ==========================================
  {
    id: 'inventory-analytics-manual',
    titleEn: 'Inventory & Analytics',
    titleHi: 'इन्वेंटरी और एनालिटिक्स (Business Intelligence)',
    categoryEn: 'Module Reference',
    categoryHi: 'मॉड्यूल संदर्भ',
    badge: 'Insights',
    summaryEn: 'Deep-dive into stock management across multiple locations and real-time business intelligence for Pi revenue optimization.',
    summaryHi: 'कई स्थानों पर स्टॉक मैनेजमेंट और Pi राजस्व को बढ़ाने के लिए रियल-टाइम बिज़नेस इंटेलिजेंस।',

    overviewEn: `The Inventory & Analytics module is the brain of your enterprise. It monitors stock levels in real-time across your entire supply chain. The Analytics engine processes thousands of data points to provide you with actionable insights, such as your most profitable categories in Pi and your customer acquisition costs.`,
    overviewHi: `इन्वेंटरी और एनालिटिक्स मॉड्यूल आपके एंटरप्राइज का मस्तिष्क है। यह आपकी पूरी सप्लाई चेन में स्टॉक लेवल की रियल-टाइम निगरानी करता है। एनालिटिक्स इंजन हजारों डेटा पॉइंट्स को प्रोसेस करके आपको उपयोगी जानकारी प्रदान करता है।`,

    purposeEn: `To eliminate "Stock-outs" and provide high-level visibility into financial performance, allowing business owners to pivot their strategies based on real Pi Network market data.`,
    purposeHi: `"आउट ऑफ स्टॉक" की समस्या को खत्म करना और वित्तीय प्रदर्शन की स्पष्ट जानकारी प्रदान करना।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Multi-Warehouse Sync',
        titleHi: 'मल्टी-वेयरहाउस सिंक',
        descriptionEn: 'View aggregated stock counts or drill down into specific regional warehouses. [Screenshot: Inventory Table]',
        descriptionHi: 'कुल स्टॉक देखें या किसी विशेष क्षेत्रीय वेयरहाउस के स्टॉक की गहराई से जांच करें।'
      },
      {
        stepNumber: 2,
        titleEn: 'Forecasting Engine',
        titleHi: 'पूर्वानुमान (Forecasting)',
        descriptionEn: 'Predict when you will run out of stock based on your current Pi sales velocity.',
        descriptionHi: 'अपनी वर्तमान बिक्री की गति के आधार पर यह अनुमान लगाएं कि स्टॉक कब खत्म होगा।'
      },
      {
        stepNumber: 3,
        titleEn: 'Revenue Visualizers',
        titleHi: 'राजस्व विजुअलाइज़र',
        descriptionEn: 'Compare daily, weekly, and monthly Pi earnings using interactive bar and line charts.',
        descriptionHi: 'इंटरैक्टिव चार्ट्स का उपयोग करके अपनी दैनिक और साप्ताहिक Pi कमाई की तुलना करें।'
      }
    ],

    benefitsEn: [
      'Automated low-stock notifications to prevent lost sales.',
      'Comprehensive Pi settlement reports for accurate bookkeeping.',
      'Heatmaps of customer locations for better logistics planning.',
      'Exportable data in multiple formats (CSV, PDF, JSON).'
    ],
    benefitsHi: [
      'बिक्री के नुकसान को रोकने के लिए ऑटोमेटेड लो-स्टॉक नोटिफिकेशन।',
      'सटीक बुककीपिंग के लिए विस्तृत Pi सेटलमेंट रिपोर्ट।',
      'लॉजिस्टिक्स प्लानिंग के लिए ग्राहकों के लोकेशन का हीटमैप।',
      'कई फॉर्मेट्स (CSV, PDF, JSON) में एक्सपोर्ट करने योग्य डेटा।'
    ],

    tipsEn: [
      'Set "Safety Stock" levels to act as a buffer for unexpected spikes in demand.',
      'Check the "Category Performance" chart to see which products are worth promoting on the homepage.',
      'Compare your "Projected vs. Actual" earnings to refine your quarterly business goals.'
    ],
    tipsHi: [
      'मांग में अचानक बढ़ोतरी से निपटने के लिए "Safety Stock" लेवल सेट करें।',
      'यह जानने के लिए "Category Performance" चार्ट देखें कि किन प्रोडक्ट्स को प्रमोट करना फायदेमंद है।'
    ],

    bestPracticesEn: [
      'Conduct a physical inventory audit once a month to reconcile your digital dashboard with actual warehouse stock.',
      'Use the "Archive" feature for products that are permanently out of production to keep your dashboard clean.',
      'Regularly review your "Escrow Release Velocity" to manage your business cashflow effectively.'
    ],
    bestPracticesHi: [
      'डैशबोर्ड और वास्तविक स्टॉक के बीच तालमेल बिठाने के लिए महीने में एक बार फिजिकल ऑडिट करें।',
      'डैशबोर्ड को व्यवस्थित रखने के लिए पुराने प्रोडक्ट्स को "Archive" करें।'
    ],

    notesEn: [
      'Accuracy: Inventory data is updated in real-time upon every order confirmation.',
      'Integration: You can connect external warehouse management systems (WMS) via our REST API.',
      'Privacy: Analytics are encrypted at rest and only viewable by authorized staff roles.'
    ],
    notesHi: [
      'सटीकता: हर ऑर्डर कन्फर्म होने पर इन्वेंटरी डेटा रियल-टाइम में अपडेट होता है।'
    ],

    faqs: [
      {
        questionEn: 'How far back does the analytics data go?',
        questionHi: 'एनालिटिक्स डेटा कितने समय पुराना हो सकता है?',
        answerEn: 'Standard users can see up to 1 year of history. Enterprise users have access to the full lifetime archive.',
        answerHi: 'स्टैंडर्ड यूजर्स 1 साल तक का इतिहास देख सकते हैं। एंटरप्राइज यूजर्स के लिए कोई समय सीमा नहीं है।'
      },
      {
        questionEn: 'Can I set different prices for different warehouses?',
        questionHi: 'क्या मैं अलग-अलग वेयरहाउस के लिए अलग कीमतें रख सकता हूं?',
        answerEn: 'Yes, use the "Regional Pricing Override" feature in the Warehouse settings.',
        answerHi: 'हाँ, वेयरहाउस सेटिंग्स में "Regional Pricing Override" फीचर का उपयोग करें।'
      }
    ]
  },

  // ==========================================
  // 14. MODULE REFERENCE - ADMIN, NOTIFICATIONS & SETTINGS
  // ==========================================
  {
    id: 'admin-settings-manual',
    titleEn: 'Admin, Notifications & Settings',
    titleHi: 'एडमिन, नोटिफिकेशन और सेटिंग्स (System Control)',
    categoryEn: 'Module Reference',
    categoryHi: 'मॉड्यूल संदर्भ',
    badge: 'System',
    summaryEn: 'The control panel for your system: Global configuration, user permissions, notification preferences, and platform security.',
    summaryHi: 'आपके सिस्टम का कंट्रोल पैनल: ग्लोबल कॉन्फ़िगरेशन, यूजर परमिशन और सुरक्षा सेटिंग्स।',

    overviewEn: `This module houses all the technical levers of your Pi Business Market account. From here, you manage your security credentials, define how you receive alerts, and customize the visual appearance of your dashboard. For "Platform Admins," this section also includes oversight tools to manage multiple sub-entities and broad system rules.`,
    overviewHi: `यह मॉड्यूल आपके अकाउंट के सभी तकनीकी पहलुओं को नियंत्रित करता है। यहाँ से आप अपनी सुरक्षा, अलर्ट्स और डैशबोर्ड के स्वरूप को मैनेज करते हैं।`,

    purposeEn: `To ensure the system is tailored to your specific operational needs and to maintain a high level of security through granular permission controls.`,
    purposeHi: `यह सुनिश्चित करना कि सिस्टम आपकी परिचालन आवश्यकताओं के अनुरूप हो और उच्च स्तर की सुरक्षा बनी रहे।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Notification Center',
        titleHi: 'नोटिफिकेशन सेंटर',
        descriptionEn: 'Toggle between Email, SMS, and In-App alerts for different event types like "New Order" or "Escrow Release".',
        descriptionHi: '"New Order" या "Escrow Release" जैसे इवेंट्स के लिए ईमेल, SMS और इन-ऐप अलर्ट्स सेट करें।'
      },
      {
        stepNumber: 2,
        titleEn: 'RBAC (Permission) Manager',
        titleHi: 'परमिशन मैनेजर (RBAC)',
        descriptionEn: 'Assign "Manager", "Staff", or "Viewer" roles to your team members to restrict sensitive data access.',
        descriptionHi: 'अपनी टीम के सदस्यों को "Manager", "Staff" या "Viewer" भूमिकाएं दें।'
      },
      {
        stepNumber: 3,
        titleEn: 'Platform Settings',
        titleHi: 'प्लेटफॉर्म सेटिंग्स',
        descriptionEn: 'Configure your primary currency display, timezone, and localized language preferences.',
        descriptionHi: 'अपनी मुख्य मुद्रा (Currency), टाइमज़ोन और भाषा प्राथमिकताएं कॉन्फ़िगर करें।'
      }
    ],

    benefitsEn: [
      'Complete control over who sees what within your business entity.',
      'Customizable alerts so you never miss a high-value Pi transaction.',
      'Centralized security management for all connected Pi Wallets.',
      'Theme customization for professional branding.'
    ],
    benefitsHi: [
      'बिज़नेस में कौन क्या देख सकता है, इस पर पूर्ण नियंत्रण।',
      'हाई-वैल्यू Pi लेनदेन के लिए कस्टमाइज़ेबल अलर्ट्स।',
      'सभी जुड़े हुए Pi वॉलेट्स के लिए केंद्रित सुरक्षा प्रबंधन।'
    ],

    tipsEn: [
      'Turn on "Push Notifications" in the Pi Browser to receive real-time shipping updates on your lock screen.',
      'Use a dedicated email address for "Order Alerts" to keep your personal inbox clean.',
      'Regularly audit your "Authorized Devices" list in the security settings.'
    ],
    tipsHi: [
      'रियल-टाइम अपडेट पाने के लिए Pi Browser में "Push Notifications" चालू करें।',
      'सुरक्षा के लिए नियमित रूप से "Authorized Devices" सूची की जांच करें।'
    ],

    bestPracticesEn: [
      'Never give "Admin" permissions to temporary staff members.',
      'Update your notification preferences monthly to avoid "Alert Fatigue".',
      'Keep a secondary contact method (like a Telegram handle) in your profile for emergency support.'
    ],
    bestPracticesHi: [
      'अस्थायी कर्मचारियों को कभी भी "Admin" परमिशन न दें।',
      'इमरजेंसी सपोर्ट के लिए अपनी प्रोफाइल में एक सेकेंडरी कॉन्टैक्ट (जैसे टेलीग्राम) रखें।'
    ],

    notesEn: [
      'Audit Logs: Every change in the Settings module is logged for security and accountability.',
      'Recovery: If you lose access, use the "Pi Network Recovery" flow within the main mining app.',
      'Limits: Some settings are locked during active escrow disputes to prevent data tampering.'
    ],
    notesHi: [
      'ऑडिट लॉग्स: सुरक्षा के लिए सेटिंग्स में किए गए हर बदलाव को रिकॉर्ड (Log) किया जाता है।'
    ],

    faqs: [
      {
        questionEn: 'Can I change my username?',
        questionHi: 'क्या मैं अपना यूजरनेम बदल सकता हूं?',
        answerEn: 'No, your username is synced directly from the Pi Network and cannot be changed here.',
        answerHi: 'नहीं, आपका यूजरनेम सीधे Pi नेटवर्क से सिंक होता है और यहाँ बदला नहीं जा सकता।'
      },
      {
        questionEn: 'How do I enable Two-Factor Authentication (2FA)?',
        questionHi: 'मैं 2FA कैसे सक्रिय कर सकता हूं?',
        answerEn: 'Pi Business Market relies on the Pi Network\'s inherent biometric/passcode security within the Pi Browser.',
        answerHi: 'Pi Business Market, Pi Browser की बायोमेट्रिक और पासकोड सुरक्षा पर निर्भर करता है।'
      }
    ]
  },

  // ==========================================
  // 15. MODULE REFERENCE - BUSINESS PROFILE
  // ==========================================
  {
    id: 'business-profile-manual',
    titleEn: 'Business Profile & Identity',
    titleHi: 'बिज़नेस प्रोफाइल और पहचान (Identity Guide)',
    categoryEn: 'Module Reference',
    categoryHi: 'मॉड्यूल संदर्भ',
    badge: 'Identity',
    summaryEn: 'Managing your professional brand: KYC verification, legal documentation, brand assets, and multi-user access control.',
    summaryHi: 'अपने प्रोफेशनल ब्रांड का प्रबंधन: KYC सत्यापन, कानूनी दस्तावेज़, ब्रांड एसेट्स और टीम एक्सेस कंट्रोल।',

    overviewEn: `Your Business Profile is the "Source of Truth" for your commercial identity on the Pi Network. It contains your verified credentials, legal name, tax registrations, and brand visual assets. A complete and verified profile increases your "Trust Score," which directly impacts your escrow release speed and search ranking in the global catalog.`,
    overviewHi: `आपकी बिज़नेस प्रोफाइल Pi नेटवर्क पर आपकी व्यावसायिक पहचान का मुख्य केंद्र है। इसमें आपके सत्यापित क्रेडेंशियल्स, कानूनी नाम और ब्रांड लोगो शामिल हैं। एक पूर्ण प्रोफाइल आपकी विश्वसनीयता (Trust Score) बढ़ाती है।`,

    purposeEn: `To establish a professional and verifiable presence that builds confidence with both individual shoppers (Pioneers) and other B2B partners.`,
    purposeHi: `एक प्रोफेशनल और सत्यापन योग्य पहचान बनाना जिससे खरीदारों और अन्य बिजनेस पार्टनर्स का भरोसा बढ़ सके।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Identity Verification',
        titleHi: 'पहचान सत्यापन (KYC)',
        descriptionEn: 'Link your Pi KYC status and upload additional business registration documents for enterprise verification.',
        descriptionHi: 'अपना Pi KYC स्टेटस लिंक करें और एंटरप्राइज वेरिफिकेशन के लिए बिज़नेस रजिस्ट्रेशन दस्तावेज़ अपलोड करें।'
      },
      {
        stepNumber: 2,
        titleEn: 'Brand Customization',
        titleHi: 'ब्रांड कस्टमाइज़ेशन',
        descriptionEn: 'Upload high-resolution logos, banners, and write a professional "About Us" section that highlights your values.',
        descriptionHi: 'हाई-रिज़ॉल्यूशन लोगो, बैनर अपलोड करें और एक प्रभावशाली "About Us" सेक्शन लिखें।'
      },
      {
        stepNumber: 3,
        titleEn: 'Contact & Location',
        titleHi: 'संपर्क और स्थान',
        descriptionEn: 'Define your primary headquarters and support contact details (Email, Telegram, WhatsApp).',
        descriptionHi: 'अपने मुख्य मुख्यालय (Headquarters) और सपोर्ट के लिए संपर्क विवरण दर्ज करें।'
      }
    ],

    benefitsEn: [
      'Verified Badge for increased conversion rates.',
      'Faster Escrow releases for "High-Trust" profiles.',
      'Ability to host multiple retail storefronts under one identity.',
      'Professional presence in the "Verified Directory" of Pi Business Market.'
    ],
    benefitsHi: [
      'ग्राहकों का भरोसा और बिक्री बढ़ाने के लिए "Verified Badge"।',
      'उच्च-विश्वसनीयता वाली प्रोफाइल के लिए तेज़ एस्क्रौ रिलीज।',
      'एक ही पहचान के तहत कई रिटेल स्टोर चलाने की क्षमता।'
    ],

    tipsEn: [
      'Use a professional high-resolution logo (512x512px) to ensure your brand looks good on all device types.',
      'Keep your "Business Category" specific (e.g., "Electronics" instead of "General") to improve search relevance.',
      'Link your official social media handles to provide extra layers of social proof.'
    ],
    tipsHi: [
      'अपने ब्रांड को बेहतर दिखाने के लिए हाई-रिज़ॉल्यूशन लोगो (512x512px) का उपयोग करें।',
      'सर्च में ऊपर आने के लिए अपनी बिज़नेस कैटेगरी को सटीक रखें।'
    ],

    bestPracticesEn: [
      'Conduct a profile audit every quarter to ensure contact details and tax registrations are up to date.',
      'Write your business bio in both English and Hindi to reach a wider audience of Pioneers.',
      'Only upload clear, un-watermarked images for your brand banners.'
    ],
    bestPracticesHi: [
      'अधिक ग्राहकों तक पहुंचने के लिए अपने बिज़नेस का विवरण अंग्रेजी और हिंदी दोनों में लिखें।'
    ],

    notesEn: [
      'Security: Changing sensitive fields (like your legal name) requires re-verification by our compliance team.',
      'Privacy: Your tax ID is encrypted and only used for internal verification; it is not public.',
      'Trust Score: Your score is visible to partners but hidden from the general shopping public.'
    ],
    notesHi: [
      'सुरक्षा: संवेदनशील जानकारी (जैसे कानूनी नाम) बदलने के लिए फिर से वेरिफिकेशन की जरूरत होती है।'
    ],

    faqs: [
      {
        questionEn: 'Can I have two different business profiles?',
        questionHi: 'क्या मेरे पास दो अलग बिज़नेस प्रोफाइल हो सकती हैं?',
        answerEn: 'Currently, each Pi Account is limited to one primary Business Entity to prevent sybil attacks and maintain ecosystem trust.',
        answerHi: 'वर्तमान में, सुरक्षा और भरोसे के लिए प्रत्येक Pi अकाउंट एक ही मुख्य बिज़नेस एंटिटी तक सीमित है।'
      },
      {
        questionEn: 'How long does the "Verified" badge take?',
        questionHi: '"Verified" बैज मिलने में कितना समय लगता है?',
        answerEn: 'After submission, our compliance team usually audits and approves profiles within 48-72 business hours.',
        answerHi: 'सबमिट करने के बाद, हमारी टीम आमतौर पर 48-72 घंटों के भीतर प्रोफाइल को अप्रूव कर देती है।'
      }
    ]
  },

  // ==========================================
  // 16. SECURITY & SAFETY - ESCROW & PAYMENTS
  // ==========================================
  {
    id: 'escrow-safety-manual',
    titleEn: 'Escrow, Payments & Safety',
    titleHi: 'एस्क्रौ, भुगतान और सुरक्षा (Safe Trading Guide)',
    categoryEn: 'Security & Safety',
    categoryHi: 'सुरक्षा और बचाव',
    badge: 'Critical',
    summaryEn: 'Deep-dive into our Web3 Escrow protocol: How funds are secured, payment confirmation, refund logic, and dispute resolution.',
    summaryHi: 'हमारे Web3 एस्क्रौ प्रोटोकॉल का विवरण: फंड कैसे सुरक्षित रहता है, भुगतान की पुष्टि और विवादों का समाधान।',

    overviewEn: `Safety is the foundation of Pi Business Market. We utilize a non-custodial smart escrow system that acts as a "Neutral Third Party" between the buyer and the seller. When a buyer pays in Pi, the tokens are not sent directly to the seller; instead, they are locked in a secure cryptographic vault. Funds are only released to the merchant once the buyer confirms receipt of the goods or a delivery deadline has passed without dispute.`,
    overviewHi: `सुरक्षा Pi Business Market की नींव है। हम एक स्मार्ट एस्क्रौ सिस्टम का उपयोग करते हैं जो खरीदार और विक्रेता के बीच एक "तटस्थ तीसरे पक्ष" के रूप में कार्य करता है। जब कोई खरीदार Pi में भुगतान करता है, तो टोकन सीधे विक्रेता को नहीं भेजे जाते; वे एक सुरक्षित वॉल्ट में लॉक हो जाते हैं।`,

    purposeEn: `To eliminate payment fraud and ensure that both parties (Buyer & Seller) are protected throughout the commerce lifecycle on the blockchain.`,
    purposeHi: `भुगतान धोखाधड़ी को खत्म करना और यह सुनिश्चित करना कि ब्लॉकचेन पर व्यापार के दौरान खरीदार और विक्रेता दोनों सुरक्षित रहें।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Payment Lock',
        titleHi: 'पेमेंट लॉक (Escrowing)',
        descriptionEn: 'The buyer authorizes a transaction via the Pi Wallet. The Pi tokens move to the marketplace escrow address.',
        descriptionHi: 'खरीदार Pi वॉलेट के माध्यम से लेनदेन को ऑथराइज करता है। Pi टोकन मार्केटप्लेस एस्क्रौ एड्रेस में चले जाते हैं।'
      },
      {
        stepNumber: 2,
        titleEn: 'Shipment Verification',
        titleHi: 'शिपमेंट सत्यापन',
        descriptionEn: 'The merchant uploads tracking data. The system monitors the parcel movement via integrated carrier APIs.',
        descriptionHi: 'मर्चेंट ट्रैकिंग डेटा अपलोड करता है। सिस्टम कूरियर पार्टनर के जरिए पार्सल की निगरानी करता है।'
      },
      {
        stepNumber: 3,
        titleEn: 'Fund Release',
        titleHi: 'फंड रिलीज',
        descriptionEn: 'Upon delivery confirmation, the buyer clicks "Release Funds" or the system auto-releases after the 7-day safety period.',
        descriptionHi: 'डिलीवरी की पुष्टि होने पर, खरीदार "Release Funds" पर क्लिक करता है या 7-दिन की अवधि के बाद सिस्टम खुद फंड जारी कर देता है।'
      }
    ],

    benefitsEn: [
      'Eliminates the risk of "Chargebacks" commonly found in traditional credit cards.',
      'Ensures buyers only pay for products they actually receive.',
      'Decentralized proof of payment recorded permanently on the Pi Blockchain.',
      'Automated refund process for unfulfilled orders.'
    ],
    benefitsHi: [
      'पारंपरिक क्रेडिट कार्ड में होने वाले "Chargebacks" के जोखिम को खत्म करता है।',
      'यह सुनिश्चित करता है कि खरीदार केवल प्राप्त उत्पादों के लिए ही भुगतान करें।',
      'पेमेंट का स्थायी प्रमाण Pi ब्लॉकचेन पर रिकॉर्ड होता है।',
      'पूरे न होने वाले ऑर्डर्स के लिए ऑटोमेटेड रिफंड प्रक्रिया।'
    ],

    tipsEn: [
      'Never send products before the Order Status changes to "Paid & Escrow Confirmed".',
      'Buyers: Do not release escrow until you have physically inspected the parcel.',
      'Use the built-in Chat to keep all payment-related discussions on the platform for use as evidence in case of disputes.'
    ],
    tipsHi: [
      'ऑर्डर स्टेटस "Paid & Escrow Confirmed" होने से पहले कभी भी सामान न भेजें।',
      'खरीदार: जब तक आप पार्सल की जांच न कर लें, तब तक एस्क्रौ रिलीज न करें।'
    ],

    bestPracticesEn: [
      'Merchants: Provide clear photos of the packaging and tracking receipt to speed up dispute resolution.',
      'Buyers: Record an "Unboxing Video" for high-value items as definitive proof of condition.',
      'Verify that you are using the official Pi Business Market wallet address during the checkout popup.'
    ],
    bestPracticesHi: [
      'मर्चेंट्स: विवादों के जल्द समाधान के लिए पैकेजिंग और ट्रैकिंग रसीद की स्पष्ट फोटो रखें।',
      'खरीदार: महंगे सामान के लिए "Unboxing Video" रिकॉर्ड करें।'
    ],

    notesEn: [
      'Arbitration: If a dispute is raised, a human moderator will review the evidence (tracking, chat logs, photos) and decide the fund allocation.',
      'Transaction Fees: Standard Pi Network blockchain fees (0.01 π) apply to every escrow transaction.',
      'Safety Window: The standard safety window is 7 days after delivery before auto-release happens.'
    ],
    notesHi: [
      'मध्यस्थता (Arbitration): विवाद होने पर, हमारी टीम सबूतों (चैट, फोटो) की समीक्षा कर फैसला लेगी।'
    ],

    faqs: [
      {
        questionEn: 'Can I cancel an order and get my Pi back?',
        questionHi: 'क्या मैं ऑर्डर कैंसिल करके अपनी Pi वापस पा सकता हूं?',
        answerEn: 'Yes, if the merchant hasn\'t shipped the item. Once shipped, a return process must be initiated to get a refund from escrow.',
        answerHi: 'हाँ, यदि मर्चेंट ने सामान शिप नहीं किया है। शिप होने के बाद, रिफंड के लिए रिटर्न प्रोसेस शुरू करना होगा।'
      },
      {
        questionEn: 'How do I know my Pi is safe?',
        questionHi: 'मुझे कैसे पता चलेगा कि मेरी Pi सुरक्षित है?',
        answerEn: 'You can verify your escrow transaction hash on the Pi Block Explorer at any time.',
        answerHi: 'आप किसी भी समय Pi Block Explorer पर अपने एस्क्रौ लेनदेन की जांच कर सकते हैं।'
      }
    ]
  },

  // ==========================================
  // 17. MODULE REFERENCE - LOGISTICS & WAREHOUSES
  // ==========================================
  {
    id: 'logistics-warehouse-manual',
    titleEn: 'Logistics & Warehouse Partners',
    titleHi: 'लॉजिस्टिक्स और वेयरहाउस पार्टनर (Logistics Guide)',
    categoryEn: 'Module Reference',
    categoryHi: 'मॉड्यूल संदर्भ',
    badge: 'Logistics',
    summaryEn: 'Guide for Warehouse Partners: Managing space, stock intake, high-speed picking, and global carrier integration.',
    summaryHi: 'वेयरहाउस पार्टनर्स के लिए गाइड: स्पेस मैनेजमेंट, स्टॉक इनटेक और कूरियर इंटीग्रेशन।',

    overviewEn: `The Logistics & Warehouse module is designed for the "Warehouse Partner" role. These partners act as the physical backbone of the Pi Business Market, providing storage and fulfillment services for multiple merchants. This module provides tools to manage "Stock Inwarding" (receiving goods), "Inventory Storage" (bin management), and "Order Dispatch" (carrier handovers).`,
    overviewHi: `लॉजिस्टिक्स और वेयरहाउस मॉड्यूल "वेयरहाउस पार्टनर" भूमिका के लिए है। ये पार्टनर मर्चेंट्स के लिए स्टोरेज और फुलफिलमेंट सेवाएं प्रदान करते हैं। यह मॉड्यूल स्टॉक प्राप्त करने, स्टोर करने और उसे डिस्पैच करने के लिए टूल्स प्रदान करता है।`,

    purposeEn: `To standardize the physical handling of goods within the ecosystem and ensure that merchants can outsource their fulfillment to professional logistics nodes with confidence.`,
    purposeHi: `इकोसिस्टम में सामान के भौतिक रख-रखाव को मानकीकृत करना और मर्चेंट्स को प्रोफेशनल लॉजिस्टिक्स सेवाएं प्रदान करना।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Inwarding Process',
        titleHi: 'इनवर्डिंग प्रक्रिया (Stock Entry)',
        descriptionEn: 'Scan incoming shipments from merchants. Verify quantities against the digital "Inwarding Note" in the app.',
        descriptionHi: 'मर्चेंट्स से आने वाले शिपमेंट को स्कैन करें और ऐप में "Inwarding Note" के साथ मात्रा का मिलान करें।'
      },
      {
        stepNumber: 2,
        titleEn: 'Bin Assignment',
        titleHi: 'बिन असाइनमेंट (Storage)',
        descriptionEn: 'Assign physical items to specific shelf/bin locations for rapid retrieval during the picking phase.',
        descriptionHi: 'तेजी से पिकिंग के लिए सामान को विशिष्ट शेल्फ या बिन लोकेशन पर असाइन करें।'
      },
      {
        stepNumber: 3,
        titleEn: 'Carrier Handoff',
        titleHi: 'कूरियर हैंडऑफ (Dispatch)',
        descriptionEn: 'Pack items according to merchant guidelines and hand them over to the integrated courier partner (e.g., Pi Logistics).',
        descriptionHi: 'मर्चेंट के निर्देशों के अनुसार सामान पैक करें और कूरियर पार्टनर को सौंप दें।'
      }
    ],

    benefitsEn: [
      'Earn Pi by providing essential storage and fulfillment services.',
      'Professional WMS (Warehouse Management System) interface included.',
      'Direct integration with major shipping carriers for automated label printing.',
      'Performance metrics to attract more high-volume merchants.'
    ],
    benefitsHi: [
      'स्टोरेज और फुलफिलमेंट सेवाएं प्रदान करके Pi कमाएं।',
      'प्रोफेशनल WMS (Warehouse Management System) इंटरफ़ेस का उपयोग।',
      'ऑटोमेटेड लेबल प्रिंटिंग के लिए प्रमुख शिपिंग कूरियर्स के साथ एकीकरण।'
    ],

    tipsEn: [
      'Organize your warehouse layout using ABC analysis (Fast-moving items near the dispatch area).',
      'Use a thermal label printer for all shipping labels to ensure scannability by carriers.',
      'Double-scan items during the packing phase to ensure 100% order accuracy.'
    ],
    tipsHi: [
      'तेजी से काम करने के लिए ज्यादा बिकने वाले सामान को डिस्पैच एरिया के पास रखें।',
      'शिपिंग लेबल के लिए थर्मल प्रिंटर का उपयोग करें ताकि वे आसानी से स्कैन हो सकें।'
    ],

    bestPracticesEn: [
      'Perform a "Cycle Count" daily on high-value Pi-inventory to prevent discrepancies.',
      'Maintain a clean and organized packing station to minimize turnaround time.',
      'Update the "Carrier Pickup" status in real-time so buyers can see accurate tracking info.'
    ],
    bestPracticesHi: [
      'स्टॉक में गड़बड़ी रोकने के लिए महंगे सामान का डेली चेक (Cycle Count) करें।',
      'बायर्स को सटीक जानकारी देने के लिए "Carrier Pickup" स्टेटस को तुरंत अपडेट करें।'
    ],

    notesEn: [
      'Insurance: Warehouse partners are encouraged to have adequate insurance coverage for stored merchant goods.',
      'Liability: The partner is responsible for the safety of the items once the "Inwarding" is confirmed.',
      'Fees: Partners set their own storage and handling fees in Pi within the Warehouse Settings.'
    ],
    notesHi: [
      'जिम्मेदारी: "Inwarding" कन्फर्म होने के बाद सामान की सुरक्षा की जिम्मेदारी पार्टनर की होती है।'
    ],

    faqs: [
      {
        questionEn: 'How do I get paid for storage?',
        questionHi: 'मुझे स्टोरेज के पैसे कैसे मिलेंगे?',
        answerEn: 'Fees are automatically deducted from the merchant\'s Pi balance at the end of each billing cycle (weekly/monthly).',
        answerHi: 'प्रत्येक बिलिंग चक्र (साप्ताहिक/मासिक) के अंत में मर्चेंट के Pi बैलेंस से फीस अपने आप कट जाएगी।'
      },
      {
        questionEn: 'Can I refuse a merchant\'s shipment?',
        questionHi: 'क्या मैं मर्चेंट का शिपमेंट मना कर सकता हूं?',
        answerEn: 'Yes, if the physical goods do not match the digital description or are in poor condition upon arrival.',
        answerHi: 'हाँ, यदि सामान डिजिटल विवरण से मेल नहीं खाता या आने पर खराब स्थिति में है।'
      }
    ]
  },

  // ==========================================
  // 18. LEGAL & COMPLIANCE - PRIVACY POLICY
  // ==========================================
  {
    id: 'privacy-policy',
    titleEn: 'Privacy Policy',
    titleHi: 'गोपनीयता नीति (Privacy Policy)',
    categoryEn: 'Legal & Compliance',
    categoryHi: 'कानूनी और अनुपालन',
    badge: 'Legal',
    summaryEn: 'Our commitment to protecting your data, covering information collection, usage, security, and your rights under GDPR.',
    summaryHi: 'आपके डेटा की सुरक्षा के लिए हमारी प्रतिबद्धता, जिसमें जानकारी का संग्रह, उपयोग, सुरक्षा और आपके अधिकार शामिल हैं।',

    overviewEn: `At Pi Business Market, we take your privacy seriously. This Privacy Policy describes how we collect, use, process, and disclose your information, including personal and business data, in conjunction with your access to and use of our Web3 marketplace. We adhere to GDPR principles and enterprise-grade security standards to ensure your decentralized identity and financial data remain protected.`,
    overviewHi: `Pi Business Market में, हम आपकी गोपनीयता को गंभीरता से लेते हैं। यह गोपनीयता नीति बताती है कि हम आपके द्वारा दी गई जानकारी का संग्रह, उपयोग और सुरक्षा कैसे करते हैं। हम GDPR सिद्धांतों और एंटरप्राइज-ग्रेड सुरक्षा मानकों का पालन करते हैं।`,

    purposeEn: `To establish transparency regarding data handling practices and ensure users are fully informed about their digital footprint within the Pi Network ecosystem.`,
    purposeHi: `डेटा हैंडलिंग प्रथाओं के बारे में पारदर्शिता स्थापित करना और उपयोगकर्ताओं को सूचित करना।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Information Collection',
        titleHi: 'जानकारी का संग्रह',
        descriptionEn: 'We collect your Pi Network username, public wallet address, and business details provided during onboarding. This includes Personal Data (name, contact) and Business Data (tax IDs, locations).',
        descriptionHi: 'हम आपका Pi नेटवर्क यूजरनेम, पब्लिक वॉलेट एड्रेस और बिज़नेस विवरण (टैक्स ID, लोकेशन) एकत्र करते हैं।'
      },
      {
        stepNumber: 2,
        titleEn: 'Secure Data Storage',
        titleHi: 'सुरक्षित डेटा स्टोरेज',
        descriptionEn: 'All persistent data is stored using Firebase Firestore with restricted access rules. Media assets are hosted securely on Cloudinary.',
        descriptionHi: 'सारा डेटा Firebase Firestore में सुरक्षित रूप से स्टोर किया जाता है। मीडिया एसेट्स Cloudinary पर होस्ट किए जाते हैं।'
      },
      {
        stepNumber: 3,
        titleEn: 'Analytics & Cookies',
        titleHi: 'एनालिटिक्स और कुकीज़',
        descriptionEn: 'We use essential session cookies for authentication and anonymized analytics to improve platform performance. No cross-site tracking is performed.',
        descriptionHi: 'हम प्रमाणीकरण के लिए सेशन कुकीज़ और प्लेटफॉर्म सुधार के लिए गुमनाम एनालिटिक्स का उपयोग करते हैं।'
      }
    ],

    benefitsEn: [
      'End-to-end encryption for all sensitive business communications.',
      'No storage of wallet passphrases—security remains in your hands.',
      'Full compliance with GDPR "Right to Access" and "Right to Erasure".',
      'Regular security audits and enterprise-grade firewall protection.'
    ],
    benefitsHi: [
      'सभी संवेदनशील बिज़नेस संचार के लिए एंड-टू-एंड एन्क्रिप्शन।',
      'वॉलेट पासफ़्रेज़ का कोई स्टोरेज नहीं—सुरक्षा आपके हाथों में है।',
      'GDPR के "Right to Access" और "Right to Erasure" का पूर्ण अनुपालन।',
      'नियमित सुरक्षा ऑडिट और एंटरप्राइज-ग्रेड फ़ायरवॉल सुरक्षा।'
    ],

    tipsEn: [
      'Use the "Privacy Settings" in your dashboard to toggle visibility of your business revenue and stock levels.',
      'Download your full data archive periodically from the Settings menu to maintain your own records.',
      'Report any suspicious phishing attempts immediately to our security team via the Inbox.'
    ],
    tipsHi: [
      'अपनी कमाई और स्टॉक की दृश्यता (Visibility) को नियंत्रित करने के लिए "Privacy Settings" का उपयोग करें।',
      'अपने रिकॉर्ड के लिए समय-समय पर सेटिंग्स मेनू से अपना डेटा आर्काइव डाउनलोड करें।'
    ],

    bestPracticesEn: [
      'Only share necessary business documents with verified partners to minimize data exposure.',
      'Ensure your staff members follow strict internal privacy protocols when handling customer data.',
      'Verify the "pi.business" domain in your browser address bar before entering any sensitive information.'
    ],
    bestPracticesHi: [
      'डेटा जोखिम कम करने के लिए केवल सत्यापित भागीदारों के साथ ही दस्तावेज़ साझा करें।',
      'ग्राहक डेटा संभालते समय स्टाफ के लिए सख्त गोपनीयता नियमों का पालन सुनिश्चित करें।'
    ],

    notesEn: [
      'Data Sharing: We do not sell data to third-party advertisers. Information is only shared with core service providers required for operation.',
      'Account Deletion: Deleting your account removes all personal records from our databases within 30 days, excluding immutable blockchain transaction logs.',
      'Contact: For privacy inquiries, contact our Data Protection Officer at privacy@pi.business.'
    ],
    notesHi: [
      'डेटा साझा करना: हम विज्ञापनदाताओं को डेटा नहीं बेचते हैं।',
      'अकाउंट हटाना: अकाउंट डिलीट करने पर 30 दिनों में सभी व्यक्तिगत रिकॉर्ड हटा दिए जाते हैं (ब्लॉकचेन लॉग्स को छोड़कर)।',
      'संपर्क: गोपनीयता संबंधी पूछताछ के लिए privacy@pi.business पर संपर्क करें।'
    ],

    faqs: [
      {
        questionEn: 'Is my Pi Wallet passphrase stored on your servers?',
        questionHi: 'क्या मेरा वॉलेट पासफ़्रेज़ आपके सर्वर पर स्टोर होता है?',
        answerEn: 'Absolutely not. All wallet interactions happen within the secure Pi Browser sandbox. We only see your public address.',
        answerHi: 'बिल्कुल नहीं। सभी वॉलेट इंटरैक्शन Pi Browser के सुरक्षित सैंडबॉक्स में होते हैं।'
      },
      {
        questionEn: 'How do you comply with GDPR?',
        questionHi: 'आप GDPR का पालन कैसे करते हैं?',
        answerEn: 'We provide users with full control over their data, including the ability to view, export, and delete their information upon request.',
        answerHi: 'हम उपयोगकर्ताओं को उनके डेटा पर पूर्ण नियंत्रण देते हैं, जिसमें उसे देखने, एक्सपोर्ट करने और हटाने की सुविधा शामिल है।'
      }
    ]
  },

  // ==========================================
  // 19. GETTING STARTED - BUSINESS SETUP GUIDE
  // ==========================================
  {
    id: 'business-setup-guide',
    titleEn: 'Complete Business Setup Guide',
    titleHi: 'बिज़नेस सेटअप पूर्ण गाइड (Setup Manual)',
    categoryEn: 'Getting Started',
    categoryHi: 'शुरुआत करें',
    badge: 'Merchant',
    summaryEn: 'A detailed manual on establishing your professional brand: branding, address verification, operational hours, and verification status.',
    summaryHi: 'अपना प्रोफेशनल ब्रांड स्थापित करने के लिए एक विस्तृत मैनुअल: ब्रांडिंग, पता सत्यापन और ऑपरेटिंग समय।',

    overviewEn: `The Business Setup process is your first step toward becoming a verified Merchant on the Pi Business Market. This guide walks you through every field in the Business Profile module, ensuring your entity is correctly classified and professionally presented to millions of Pi Pioneers. Proper setup is critical for passing the compliance audit and receiving your "Verified" badge.`,
    overviewHi: `बिज़नेस सेटअप प्रक्रिया Pi Business Market पर एक सत्यापित मर्चेंट बनने की दिशा में आपका पहला कदम है। यह गाइड आपको बिज़नेस प्रोफाइल मॉड्यूल के हर फील्ड के बारे में बताएगी ताकि आपकी प्रोफाइल प्रोफेशनल दिखे।`,

    purposeEn: `To provide clear, field-by-field instructions for merchants to minimize setup errors and accelerate the verification process.`,
    purposeHi: `व्यापारियों को स्पष्ट निर्देश प्रदान करना ताकि सेटअप की गलतियाँ कम हों और वेरिफिकेशन प्रक्रिया तेज हो सके।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Entity Initiation',
        titleHi: 'एंटिटी की शुरुआत',
        descriptionEn: 'Click "Create Business" in your personal dashboard. This initiates your unique Business ID in our Web3 database.',
        descriptionHi: 'अपने डैशबोर्ड में "Create Business" पर क्लिक करें। यह हमारे डेटाबेस में आपकी यूनिक बिज़नेस ID बनाता है।'
      },
      {
        stepNumber: 2,
        titleEn: 'Core Identity Entry',
        titleHi: 'मुख्य पहचान दर्ज करें',
        descriptionEn: 'Enter your Business Name and select the most accurate Category. Explain your mission in the "About" section.',
        descriptionHi: 'अपना बिज़नेस नाम लिखें और सही कैटेगरी चुनें। "About" सेक्शन में अपने बिज़नेस के बारे में बताएं।'
      },
      {
        stepNumber: 3,
        titleEn: 'Visual Branding',
        titleHi: 'विजुअल ब्रांडिंग (Branding)',
        descriptionEn: 'Upload your Logo (Square) and Cover Image (Wide). These are the first things customers see in the Catalog.',
        descriptionHi: 'अपना लोगो (लोगो) और कवर इमेज अपलोड करें। ग्राहक कैटलॉग में सबसे पहले यही देखते हैं।'
      },
      {
        stepNumber: 4,
        titleEn: 'Operational Details',
        titleHi: 'परिचालन विवरण (Operations)',
        descriptionEn: 'Add your physical address, support contact info, and business hours to set customer expectations.',
        descriptionHi: 'अपना पता, सपोर्ट कांटेक्ट और बिज़नेस का समय (Hours) दर्ज करें।'
      }
    ],

    benefitsEn: [
      'Field-level validation to ensure data accuracy.',
      'Auto-scaling branding assets for a professional look on all screens.',
      'Integration with global maps for address accuracy.',
      'Clear roadmap to achieving "Verified" status.'
    ],
    benefitsHi: [
      'डेटा सटीकता सुनिश्चित करने के लिए फील्ड-लेवल वैलिडेशन।',
      'सभी स्क्रीन पर प्रोफेशनल लुक के लिए ऑटो-स्केलिंग ब्रांडिंग एसेट्स।',
      'सटीक पते के लिए ग्लोबल मैप्स के साथ एकीकरण।',
      'सत्यापित (Verified) स्टेटस प्राप्त करने के लिए स्पष्ट मार्गदर्शन।'
    ],

    tipsEn: [
      'Business Categories: Choose the narrowest possible category to improve search relevance for your target audience.',
      'Branding: Use a transparent PNG for your logo to ensure it blends seamlessly with the dashboard theme.',
      'Social Links: Add links to your verified Twitter or LinkedIn to significantly speed up your manual verification audit.'
    ],
    tipsHi: [
      'बिज़नेस कैटेगरी: सर्च में बेहतर दिखने के लिए सबसे सटीक कैटेगरी चुनें।',
      'ब्रांडिंग: प्रोफेशनल लुक के लिए ट्रांसपेरेंट PNG लोगो का उपयोग करें।',
      'सोशल लिंक्स: वेरिफिकेशन तेज करने के लिए अपने ट्विटर या लिंक्डइन हैंडल जोड़ें।'
    ],

    bestPracticesEn: [
      'Field Explanation - Business Address: Provide your full legal address as it appears on your tax documents to pass KYC faster.',
      'Field Explanation - Business Hours: Set your hours in UTC or provide your local timezone to avoid confusion for international buyers.',
      'Field Explanation - Contact Details: Use a dedicated support email (e.g., support@yourbrand.com) rather than a personal one.'
    ],
    bestPracticesHi: [
      'बिज़नेस एड्रेस: KYC पास करने के लिए अपना सही कानूनी पता दें।',
      'संपर्क विवरण: प्रोफेशनल इमेज के लिए एक समर्पित सपोर्ट ईमेल का उपयोग करें।'
    ],

    notesEn: [
      'Verification Status - Unverified: Initial state. Limited sales volume allowed.',
      'Verification Status - Pending: Under manual review by our compliance team (48-72 hours).',
      'Verification Status - Verified: Full access to all enterprise tools and global catalog ranking boost.'
    ],
    notesHi: [
      'सत्यापन स्थिति (Unverified): शुरुआती स्थिति। बिक्री की सीमा सीमित होती है।',
      'सत्यापन स्थिति (Verified): सभी एंटरप्राइज टूल्स तक पूर्ण पहुंच और रैंकिंग में बढ़ोतरी।'
    ],

    faqs: [
      {
        questionEn: 'Can I change my Business Category later?',
        questionHi: 'क्या मैं बाद में अपनी बिज़नेस कैटेगरी बदल सकता हूं?',
        answerEn: 'Yes, but changing it frequently may trigger a manual re-verification of your profile.',
        answerHi: 'हाँ, लेकिन इसे बार-बार बदलने से आपकी प्रोफाइल का दोबारा वेरिफिकेशन हो सकता है।'
      },
      {
        questionEn: 'What is the recommended size for the Cover Image?',
        questionHi: 'कवर इमेज के लिए अनुशंसित साइज क्या है?',
        answerEn: 'For best results, use a 1200x400 pixel image with a landscape aspect ratio.',
        answerHi: 'बेहतर रिज़ल्ट के लिए 1200x400 पिक्सल वाली लैंडस्केप इमेज का उपयोग करें।'
      }
    ]
  },

  // ==========================================
  // 20. MODULE REFERENCE - ORDER MANAGEMENT DEEP DIVE
  // ==========================================
  {
    id: 'order-management-deep-dive',
    titleEn: 'Order Management Deep Dive',
    titleHi: 'ऑर्डर मैनेजमेंट की पूरी जानकारी (Order Guide)',
    categoryEn: 'Module Reference',
    categoryHi: 'मॉड्यूल संदर्भ',
    badge: 'Critical',
    summaryEn: 'A master guide to the order lifecycle: Status definitions (Pending, Completed, Cancelled), handling returns, and refund logic.',
    summaryHi: 'ऑर्डर जीवनचक्र के लिए एक मास्टर गाइड: स्टेटस परिभाषाएं (Pending, Completed, Cancelled), रिटर्न और रिफंड लॉजिक।',

    overviewEn: `The Order Management module is the heart of your daily operations. It tracks every Pi transaction from the moment a Pioneer clicks "Buy" until the final escrow release. This deep dive explains the technical meaning of each status and provides the workflows for handling exceptions like cancellations and product returns.`,
    overviewHi: `ऑर्डर मैनेजमेंट मॉड्यूल आपके दैनिक कार्यों का केंद्र है। यह "Buy" क्लिक करने से लेकर एस्क्रौ रिलीज तक हर Pi ट्रांजेक्शन को ट्रैक करता है। यह गाइड हर स्टेटस का तकनीकी अर्थ और रिटर्न जैसी स्थितियों को संभालने के वर्कफ़्लो को समझाती है।`,

    purposeEn: `To ensure merchants can accurately track fulfillment progress and handle buyer requests professionally, maintaining a high platform trust score.`,
    purposeHi: `यह सुनिश्चित करना कि मर्चेंट शिपमेंट की प्रगति को सटीक रूप से ट्रैक कर सकें और ग्राहकों के अनुरोधों को प्रोफेशनल तरीके से संभाल सकें।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Order Status: Pending',
        titleHi: 'ऑर्डर स्टेटस: पेंडिंग (Pending)',
        descriptionEn: 'The buyer has initiated the order but the Pi payment is still being confirmed on the blockchain. Do not ship yet.',
        descriptionHi: 'खरीदार ने ऑर्डर शुरू कर दिया है लेकिन Pi पेमेंट अभी ब्लॉकचेन पर कन्फर्म हो रहा है। अभी सामान न भेजें।'
      },
      {
        stepNumber: 2,
        titleEn: 'Order Status: Processing',
        titleHi: 'ऑर्डर स्टेटस: प्रोसेसिंग (Processing)',
        descriptionEn: 'Payment is confirmed in escrow. Merchant is now authorized to pick, pack, and prepare the shipment.',
        descriptionHi: 'पेमेंट एस्क्रौ में कन्फर्म हो गया है। मर्चेंट अब सामान पैक और शिप करने के लिए अधिकृत है।'
      },
      {
        stepNumber: 3,
        titleEn: 'Order Status: Shipped',
        titleHi: 'ऑर्डर स्टेटस: शिप्ड (Shipped)',
        descriptionEn: 'Tracking number is assigned. The parcel is with the carrier. Funds remain locked in escrow during transit.',
        descriptionHi: 'ट्रैकिंग नंबर दे दिया गया है। पार्सल कूरियर के पास है। ट्रांजिट के दौरान फंड एस्क्रौ में लॉक रहता है।'
      },
      {
        stepNumber: 4,
        titleEn: 'Order Status: Completed',
        titleHi: 'ऑर्डर स्टेटस: पूर्ण (Completed)',
        descriptionEn: 'Buyer has confirmed delivery. Pi tokens are released from escrow to the merchant\'s main wallet.',
        descriptionHi: 'खरीदार ने डिलीवरी की पुष्टि कर दी है। Pi टोकन एस्क्रौ से मर्चेंट के मुख्य वॉलेट में आ गए हैं।'
      }
    ],

    benefitsEn: [
      'Real-time status synchronization with the Pi Blockchain.',
      'Automated email/push alerts for status changes.',
      'One-click cancellation for unfulfilled pending orders.',
      'Detailed timeline view for every transaction audit.'
    ],
    benefitsHi: [
      'Pi ब्लॉकचेन के साथ रियल-टाइम स्टेटस सिंक।',
      'स्टेटस बदलने पर ऑटोमेटेड ईमेल और पुश अलर्ट।',
      'पेंडिंग ऑर्डर्स के लिए वन-क्लिक कैंसिलेशन।',
      'हर ट्रांजैक्शन ऑडिट के लिए विस्तृत टाइमलाइन व्यू।'
    ],

    tipsEn: [
      'Cancelled Orders: If an order is cancelled before shipping, the Pi tokens are automatically returned to the buyer minus the gas fee.',
      'Returns & Returns Status: Mark an order as "Return Initiated" to pause the escrow timer while the physical item is sent back.',
      'Refunds (Future Ready): Our system is architected for partial refunds, which will be enabled in the next protocol upgrade.'
    ],
    tipsHi: [
      'कैंसिल ऑर्डर: यदि शिपिंग से पहले ऑर्डर कैंसिल होता है, तो Pi टोकन खरीदार को वापस मिल जाते हैं।',
      'रिटर्न स्टेटस: सामान वापस आने तक एस्क्रौ टाइमर रोकने के लिए "Return Initiated" मार्क करें।'
    ],

    bestPracticesEn: [
      'Workflow - Daily Audit: Filter for "Processing" orders every morning to ensure you meet your 24-hour shipping SLA.',
      'Workflow - Disputes: If a "Completed" status is not reached within 14 days, proactively check the tracking status before the buyer raises a dispute.',
      'Field Description - Tracking ID: Always verify the tracking ID before saving; incorrect IDs can lead to payment delays.'
    ],
    bestPracticesHi: [
      'डेली ऑडिट: रोज सुबह "Processing" ऑर्डर्स चेक करें ताकि आप 24 घंटे में शिपिंग कर सकें।',
      'ट्रैकिंग ID: सेव करने से पहले हमेशा ट्रैकिंग ID की जांच करें; गलत ID से पेमेंट में देरी हो सकती है।'
    ],

    notesEn: [
      'Mistakes: Never mark an item as "Shipped" if you don\'t have a valid tracking number—this is a violation of merchant terms.',
      'Troubleshooting: If a payment is stuck in "Pending," check the Pi Block Explorer to see if the transaction is still in the mempool.',
      'Security: All order modifications are cryptographically signed for accountability.'
    ],
    notesHi: [
      'सावधानी: वैध ट्रैकिंग नंबर के बिना कभी भी सामान को "Shipped" मार्क न करें।'
    ],

    faqs: [
      {
        questionEn: 'Can I cancel an order after it has been shipped?',
        questionHi: 'क्या मैं शिप होने के बाद ऑर्डर कैंसिल कर सकता हूं?',
        answerEn: 'No. Once "Shipped", the merchant must follow the Return workflow to ensure the goods are returned before funds are refunded.',
        answerHi: 'नहीं। शिप होने के बाद, रिफंड के लिए रिटर्न वर्कफ़्लो का पालन करना होगा।'
      },
      {
        questionEn: 'How do I handle a partial shipment?',
        questionHi: 'मैं आंशिक शिपमेंट (Partial Shipment) को कैसे संभालूं?',
        answerEn: 'Currently, we recommend splitting the order into two separate transactions if items are coming from different warehouses.',
        answerHi: 'वर्तमान में, हम ऑर्डर को दो अलग-अलग ट्रांजैक्शन में बांटने की सलाह देते हैं।'
      }
    ]
  },

  // ==========================================
  // 21. MODULE REFERENCE - CUSTOMER MANAGEMENT & CRM
  // ==========================================
  {
    id: 'customer-management-crm',
    titleEn: 'Customer Management & CRM',
    titleHi: 'ग्राहक प्रबंधन और CRM (Customer Guide)',
    categoryEn: 'Module Reference',
    categoryHi: 'मॉड्यूल संदर्भ',
    badge: 'Engagement',
    summaryEn: 'Complete guide to managing your buyer database: Customer profiles, purchase history, lifetime value, and support tickets.',
    summaryHi: 'अपने खरीदार डेटाबेस को प्रबंधित करने के लिए पूर्ण गाइड: ग्राहक प्रोफाइल, खरीदारी इतिहास और सपोर्ट टिकट्स।',

    overviewEn: `The Customer Management (CRM) module is where you build long-term relationships with the Pi community. Every Pioneer who buys from your store is automatically added to your CRM database. You can view their total lifetime spend in Pi, their frequency of purchase, and their unique "Buyer Reputation" score. This data is essential for targeted marketing and providing high-quality support.`,
    overviewHi: `कस्टमर मैनेजमेंट (CRM) मॉड्यूल वह जगह है जहाँ आप Pi समुदाय के साथ दीर्घकालिक संबंध बनाते हैं। आपकी दुकान से खरीदने वाला हर Pioneer अपने आप आपके CRM डेटाबेस में जुड़ जाता है। आप उनका कुल Pi खर्च और "Buyer Reputation" स्कोर देख सकते हैं।`,

    purposeEn: `To provide merchants with a 360-degree view of their customer base, enabling data-driven loyalty programs and efficient resolution of support inquiries.`,
    purposeHi: `मर्चेंट्स को उनके ग्राहकों का पूर्ण विवरण प्रदान करना, जिससे वे बेहतर सर्विस और रिवॉर्ड प्रोग्राम चला सकें।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Customer Directory',
        titleHi: 'ग्राहक निर्देशिका (Directory)',
        descriptionEn: 'A searchable list of all users who have interacted with your business. Filter by location, spend, or last order date.',
        descriptionHi: 'उन सभी यूजर्स की सूची जिन्होंने आपके बिज़नेस के साथ व्यवहार किया है। उन्हें लोकेशन या खर्च के आधार पर फ़िल्टर करें।'
      },
      {
        stepNumber: 2,
        titleEn: 'Profile Deep-Dive',
        titleHi: 'प्रोफाइल की गहराई से जांच',
        descriptionEn: 'Click any name to see their full transaction history, unread messages, and internal staff notes about the customer.',
        descriptionHi: 'किसी भी नाम पर क्लिक करके उनका पूरा ट्रांजैक्शन इतिहास और मैसेज देखें।'
      },
      {
        stepNumber: 3,
        titleEn: 'Loyalty Tiers',
        titleHi: 'लोयल्टी टियर्स (Loyalty)',
        descriptionEn: 'The system automatically tags customers as "Bronze", "Silver", or "Gold" based on their Pi spending milestones.',
        descriptionHi: 'सिस्टम अपने आप ग्राहकों को उनके Pi खर्च के आधार पर "Bronze", "Silver" या "Gold" टैग देता है।'
      }
    ],

    benefitsEn: [
      'Centralized inbox for all customer communications.',
      'Visibility into buyer behavior patterns for better inventory planning.',
      'Ability to block high-risk or abusive users from your storefront.',
      'Integration with order data for instant context during support chats.'
    ],
    benefitsHi: [
      'सभी ग्राहक संचार के लिए केंद्रीकृत इनबॉक्स।',
      'बेहतर योजना के लिए खरीदार के व्यवहार को समझने की क्षमता।',
      'जोखिम भरे या अभद्र व्यवहार वाले यूजर्स को ब्लॉक करने की सुविधा।'
    ],

    tipsEn: [
      'Internal Notes: Use the private "Staff Notes" field to document specific customer preferences (e.g., "Prefers eco-friendly packaging").',
      'Reputation Score: Check a buyer\'s reputation score before accepting high-value custom orders to minimize dispute risk.',
      'Lifetime Value (LTV): Prioritize support for customers with a high LTV to encourage repeat business.'
    ],
    tipsHi: [
      'इंटरनल नोट्स: ग्राहकों की पसंद को रिकॉर्ड करने के लिए प्राइवेट "Staff Notes" फील्ड का उपयोग करें।',
      'रेपुटेशन स्कोर: जोखिम कम करने के लिए बड़े ऑर्डर स्वीकार करने से पहले खरीदार का रेपुटेशन स्कोर देखें।'
    ],

    bestPracticesEn: [
      'Workflow - Support: Respond to new CRM messages within 12 hours to maintain a "Fast Responder" badge on your profile.',
      'Workflow - Engagement: Periodically review your "Top 10 Customers" and send them a personalized "Thank You" via the Pi Business Market inbox.',
      'Field Description - Customer Tag: Use custom tags (e.g., "Wholesale", "VIP") to segment your database for future promotions.'
    ],
    bestPracticesHi: [
      'सपोर्ट वर्कफ़्लो: प्रोफाइल पर "Fast Responder" बैज बनाए रखने के लिए 12 घंटे में जवाब दें।',
      'कस्टम टैग: भविष्य के प्रमोशन के लिए अपने डेटाबेस को सेगमेंट करने के लिए कस्टम टैग (जैसे "VIP") का उपयोग करें।'
    ],

    notesEn: [
      'Privacy: You can see a buyer\'s public profile and order history, but you can never see their private wallet passphrase or Pi mining logs.',
      'Common Mistakes: Don\'t ignore low-rated customers; proactive support can often turn a negative experience into a positive review.',
      'Troubleshooting: If a customer isn\'t appearing in your CRM, ensure their first order has reached at least the "Processing" status.'
    ],
    notesHi: [
      'गोपनीयता: आप खरीदार की प्रोफाइल और ऑर्डर इतिहास देख सकते हैं, लेकिन उनका प्राइवेट पासफ़्रेज़ कभी नहीं।'
    ],

    faqs: [
      {
        questionEn: 'Can I export my customer list?',
        questionHi: 'क्या मैं अपनी ग्राहक सूची एक्सपोर्ट कर सकता हूं?',
        answerEn: 'Yes. Go to Customers > Export to download a CSV file of your buyer database for external marketing tools.',
        answerHi: 'हाँ। बाहरी मार्केटिंग टूल्स के लिए अपनी ग्राहक सूची को CSV फाइल में डाउनलोड करने के लिए Customers > Export पर जाएं।'
      },
      {
        questionEn: 'How do I block a customer?',
        questionHi: 'मैं किसी ग्राहक को ब्लॉक कैसे कर सकता हूं?',
        answerEn: 'Open the customer\'s profile and select "Restrict Access". They will no longer be able to place new orders from your store.',
        answerHi: 'ग्राहक की प्रोफाइल खोलें और "Restrict Access" चुनें। वे आपके स्टोर से नए ऑर्डर नहीं दे पाएंगे।'
      }
    ]
  },

  // ==========================================
  // 22. GLOBAL HELP CENTER - THE FAQ BANK
  // ==========================================
  {
    id: 'global-help-center',
    titleEn: 'Global Help Center & FAQ Bank',
    titleHi: 'ग्लोबल हेल्प सेंटर और FAQ बैंक (Help Center)',
    categoryEn: 'Help Center',
    categoryHi: 'सहायता केंद्र',
    badge: 'Support',
    summaryEn: 'The definitive repository of 100+ frequently asked questions covering every aspect of the Pi Business Market ecosystem.',
    summaryHi: 'Pi Business Market इकोसिस्टम के हर पहलू को कवर करने वाले 100+ अक्सर पूछे जाने वाले प्रश्नों का निश्चित संग्रह।',

    overviewEn: `The Global Help Center is designed to provide instant answers to the most common inquiries from both Pioneers and Merchants. We have compiled over 100 technical and operational questions categorized by module. Whether you are struggling with your first Pi Wallet connection or managing a multi-warehouse logistics network, you will find the solution here.`,
    overviewHi: `ग्लोबल हेल्प सेंटर खरीदारों और विक्रेताओं दोनों के लिए सबसे सामान्य पूछताछ के तत्काल उत्तर प्रदान करने के लिए बनाया गया है। हमने 100 से अधिक तकनीकी और परिचालन संबंधी प्रश्नों को यहाँ संकलित किया है।`,

    purposeEn: `To reduce support ticket volume and empower users with self-service knowledge, ensuring a friction-less experience on the platform.`,
    purposeHi: `सपोर्ट टिकटों की संख्या कम करना और उपयोगकर्ताओं को स्वयं सहायता के लिए जानकारी प्रदान करना।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Browse Categories',
        titleHi: 'कैटेगरी ब्राउज़ करें',
        descriptionEn: 'Select the relevant category (e.g., "Pi Wallet" or "Store Setup") to narrow down your search.',
        descriptionHi: 'अपनी खोज को आसान बनाने के लिए संबंधित कैटेगरी (जैसे "Pi Wallet") चुनें।'
      },
      {
        stepNumber: 2,
        titleEn: 'Search Keyword',
        titleHi: 'कीवर्ड सर्च करें',
        descriptionEn: 'Use the top search bar to find specific technical terms like "Escrow" or "KYC".',
        descriptionHi: '"Escrow" या "KYC" जैसे विशिष्ट शब्दों को खोजने के लिए सर्च बार का उपयोग करें।'
      },
      {
        stepNumber: 3,
        titleEn: 'Expand FAQ',
        titleHi: 'FAQ विस्तार करें',
        descriptionEn: 'Click on a question to see the detailed answer in both English and Easy Hindi.',
        descriptionHi: 'विस्तृत उत्तर देखने के लिए किसी भी प्रश्न पर क्लिक करें।'
      }
    ],

    benefitsEn: [
      '24/7 access to critical platform information.',
      'Clear, jargon-free explanations for Web3 concepts.',
      'Bilingual content to support the global Pi community.',
      'Step-by-step troubleshooting for common technical errors.'
    ],
    benefitsHi: [
      'प्लेटफॉर्म की महत्वपूर्ण जानकारी तक 24/7 पहुंच।',
      'Web3 अवधारणाओं के लिए सरल और स्पष्ट व्याख्या।',
      'वैश्विक Pi समुदाय के समर्थन के लिए द्विभाषी सामग्री।',
      'सामान्य तकनीकी त्रुटियों के लिए चरण-दर-चरण समाधान।'
    ],

    tipsEn: [
      'If you can\'t find your answer here, use the "Contact Support" button in your Inbox to speak with a human agent.',
      'Check the "Recent Updates" section daily for new feature FAQs and security alerts.',
      'Screenshots: Most technical FAQs include a visual reference to help you locate UI elements.'
    ],
    tipsHi: [
      'यदि आपको उत्तर यहाँ नहीं मिलता है, तो इनबॉक्स में "Contact Support" बटन का उपयोग करें।',
      'नई सुविधाओं और सुरक्षा अलर्ट के लिए "Recent Updates" सेक्शन देखें।'
    ],

    bestPracticesEn: [
      'Always search the FAQ before opening a support ticket to save time.',
      'Share relevant FAQ links with your customers to help them navigate the checkout process.',
      'Keep a bookmark of this page for quick reference during merchant operations.'
    ],
    bestPracticesHi: [
      'समय बचाने के लिए सपोर्ट टिकट खोलने से पहले हमेशा FAQ में सर्च करें।',
      'चेकआउट प्रक्रिया में मदद के लिए अपने ग्राहकों के साथ संबंधित FAQ लिंक साझा करें।'
    ],

    notesEn: [
      'Version: This FAQ bank is updated weekly based on community feedback and system upgrades.',
      'Accuracy: All answers are verified by our compliance and technical teams.',
      'Compliance: This center follows enterprise SaaS documentation standards.'
    ],
    notesHi: [
      'नोट: यह FAQ बैंक समुदाय की प्रतिक्रिया के आधार पर साप्ताहिक रूप से अपडेट किया जाता है।'
    ],

    faqs: [
      // 1-10: Login & Authentication
      { questionEn: 'Is my Pi Network login secure?', questionHi: 'क्या मेरा Pi नेटवर्क लॉगिन सुरक्षित है?', answerEn: 'Yes, we use the official Pi SDK which never shares your password with us.', answerHi: 'हाँ, हम आधिकारिक Pi SDK का उपयोग करते हैं जो आपका पासवर्ड हमारे साथ साझा नहीं करता है।' },
      { questionEn: 'Why do I see "Authentication Denied"?', questionHi: '"Authentication Denied" क्यों दिख रहा है?', answerEn: 'This usually happens if you are not inside the Pi Browser or have revoked permissions.', answerHi: 'यह आमतौर पर तब होता है जब आप Pi Browser के भीतर नहीं होते हैं।' },
      { questionEn: 'Can I log in on a desktop computer?', questionHi: 'क्या मैं डेस्कटॉप कंप्यूटर पर लॉगिन कर सकता हूं?', answerEn: 'Yes, but you will need to scan a QR code using your Pi Browser for security.', answerHi: 'हाँ, लेकिन सुरक्षा के लिए आपको Pi Browser का उपयोग करके QR कोड स्कैन करना होगा।' },
      { questionEn: 'What is a Pi Username?', questionHi: 'Pi यूजरनेम क्या है?', answerEn: 'It is your unique identity in the Pi ecosystem, synced automatically from your profile.', answerHi: 'यह Pi इकोसिस्टम में आपकी यूनिक आईडी है, जो आपकी प्रोफाइल से सिंक होती है।' },
      { questionEn: 'Do I need to remember a password?', questionHi: 'क्या मुझे पासवर्ड याद रखने की जरूरत है?', answerEn: 'No. Login is handled entirely via your verified Pi account.', answerHi: 'नहीं, लॉगिन आपके सत्यापित Pi अकाउंट के माध्यम से होता है।' },
      { questionEn: 'How do I log out?', questionHi: 'मैं लॉग आउट कैसे करूँ?', answerEn: 'Click your avatar and select "Logout" from the dropdown menu.', answerHi: 'अपनी प्रोफाइल फोटो पर क्लिक करें और "Logout" चुनें।' },
      { questionEn: 'Is my session permanent?', questionHi: 'क्या मेरा सेशन स्थायी है?', answerEn: 'For security, sessions expire after 24 hours of inactivity.', answerHi: 'सुरक्षा के लिए, 24 घंटे की निष्क्रियता के बाद सेशन समाप्त हो जाता है।' },
      { questionEn: 'Can I use two accounts?', questionHi: 'क्या मैं दो अकाउंट इस्तेमाल कर सकता हूं?', answerEn: 'One account per person is required to maintain ecosystem integrity.', answerHi: 'इकोसिस्टम की शुद्धता बनाए रखने के लिए प्रति व्यक्ति एक ही अकाउंट मान्य है।' },
      { questionEn: 'What if I lose my Pi account?', questionHi: 'अगर मेरा Pi अकाउंट खो जाए तो?', answerEn: 'You must recover it through the main Pi Network mining app recovery process.', answerHi: 'आपको इसे मुख्य Pi माइनिंग ऐप की रिकवरी प्रक्रिया के माध्यम से वापस पाना होगा।' },
      { questionEn: 'Is my data shared with other apps?', questionHi: 'क्या मेरा डेटा अन्य ऐप्स के साथ साझा किया जाता है?', answerEn: 'No. Your data is only used within the Pi Business Market ecosystem.', answerHi: 'नहीं, आपका डेटा केवल इसी मार्केटप्लेस में उपयोग किया जाता है।' },

      // 11-20: Pi Wallet & Payments
      { questionEn: 'What is the transaction fee in Pi?', questionHi: 'Pi में ट्रांजैक्शन फीस क्या है?', answerEn: 'The standard Pi Network blockchain fee is 0.01 π per transaction.', answerHi: 'स्टैंडर्ड ब्लॉकचेन फीस 0.01 π प्रति ट्रांजैक्शन है।' },
      { questionEn: 'How long does escrow hold my funds?', questionHi: 'एस्क्रौ मेरे फंड को कब तक रोक कर रखता है?', answerEn: 'Funds are typically released 7 days after delivery confirmation.', answerHi: 'डिलीवरी की पुष्टि के 7 दिन बाद फंड जारी किया जाता है।' },
      { questionEn: 'Is Testnet Pi real money?', questionHi: 'क्या टेस्टनेट Pi असली पैसा है?', answerEn: 'No. Testnet Pi has no value and is used only for testing platform features.', answerHi: 'नहीं, टेस्टनेट Pi का कोई मूल्य नहीं है और यह केवल टेस्टिंग के लिए है।' },
      { questionEn: 'Where can I see my transaction hash?', questionHi: 'मैं अपना ट्रांजैक्शन हैश कहाँ देख सकता हूँ?', answerEn: 'In the order details, click the "View on Pi Explorer" link.', answerHi: 'ऑर्डर डिटेल्स में "View on Pi Explorer" लिंक पर क्लिक करें।' },
      { questionEn: 'What happens if a merchant doesn\'t ship?', questionHi: 'अगर मर्चेंट सामान नहीं भेजता है तो क्या होगा?', answerEn: 'You can cancel the order after 48 hours to get a full refund from escrow.', answerHi: '48 घंटे बाद आप ऑर्डर कैंसिल करके एस्क्रौ से रिफंड पा सकते हैं।' },
      { questionEn: 'Why is my balance not updating?', questionHi: 'मेरा बैलेंस अपडेट क्यों नहीं हो रहा है?', answerEn: 'Click the "Sync" icon to fetch the latest state from the blockchain.', answerHi: 'ब्लॉकचेन से लेटेस्ट डेटा पाने के लिए "Sync" आइकन पर क्लिक करें।' },
      { questionEn: 'Can I pay with credit cards?', questionHi: 'क्या मैं क्रेडिट कार्ड से भुगतान कर सकता हूं?', answerEn: 'No. We only support native Pi (π) payments for all transactions.', answerHi: 'नहीं, हम केवल Pi (π) पेमेंट्स का ही समर्थन करते हैं।' },
      { questionEn: 'What is a "Gas Fee"?', questionHi: '"Gas Fee" क्या है?', answerEn: 'It is the small fee paid to the blockchain network to process your payment.', answerHi: 'यह आपके पेमेंट को प्रोसेस करने के लिए ब्लॉकचेन नेटवर्क को दिया जाने वाला शुल्क है।' },
      { questionEn: 'Is my wallet passphrase safe?', questionHi: 'क्या मेरा वॉलेट पासफ़्रेज़ सुरक्षित है?', answerEn: 'Yes. We never see or store your passphrase. All signing stays in your browser.', answerHi: 'हाँ, हम आपका पासफ़्रेज़ कभी नहीं देखते या स्टोर नहीं करते हैं।' },
      { questionEn: 'How do I release escrow manually?', questionHi: 'मैं मैन्युअल रूप से एस्क्रौ कैसे रिलीज़ करूँ?', answerEn: 'Go to your Order history and click the "Confirm Delivery" button.', answerHi: 'अपने ऑर्डर इतिहास में जाएं और "Confirm Delivery" बटन पर क्लिक करें।' },

      // 21-30: Business & Merchant
      { questionEn: 'How do I become a "Verified Merchant"?', questionHi: '"Verified Merchant" कैसे बनें?', answerEn: 'Complete your Business Profile and submit it for manual review.', answerHi: 'अपनी बिज़नेस प्रोफाइल पूरी करें और इसे रिव्यू के लिए सबमिट करें।' },
      { questionEn: 'Is there a signup fee for businesses?', questionHi: 'क्या बिज़नेस के लिए कोई साइनअप फीस है?', answerEn: 'No. It is free to create a business entity on our platform.', answerHi: 'नहीं, हमारे प्लेटफॉर्म पर बिज़नेस बनाना फ्री है।' },
      { questionEn: 'Can I sell services instead of products?', questionHi: 'क्या मैं प्रोडक्ट्स के बजाय सेवाएं बेच सकता हूं?', answerEn: 'Yes. Use the "Digital Service" category when creating your store.', answerHi: 'हाँ, स्टोर बनाते समय "Digital Service" कैटेगरी चुनें।' },
      { questionEn: 'How many stores can I own?', questionHi: 'मैं कितने स्टोर का मालिक बन सकता हूं?', answerEn: 'Verified businesses can create up to 5 individual storefronts.', answerHi: 'सत्यापित बिज़नेस 5 अलग-अलग स्टोर बना सकते हैं।' },
      { questionEn: 'What is a "Business ID"?', questionHi: '"Business ID" क्या है?', answerEn: 'A unique identifier for your legal entity in our marketplace.', answerHi: 'यह हमारे मार्केटप्लेस में आपकी कानूनी इकाई की यूनिक पहचान है।' },
      { questionEn: 'How do I add team members?', questionHi: 'मैं टीम मेंबर्स कैसे जोड़ूँ?', answerEn: 'Go to Business Settings > Team and invite them via Pi username.', answerHi: 'Business Settings > Team पर जाएं और Pi यूजरनेम से आमंत्रित करें।' },
      { questionEn: 'Can I change my business logo?', questionHi: 'क्या मैं अपना बिज़नेस लोगो बदल सकता हूँ?', answerEn: 'Yes, in the Business Profile editor at any time.', answerHi: 'हाँ, बिज़नेस प्रोफाइल एडिटर में कभी भी बदल सकते हैं।' },
      { questionEn: 'What are "Operating Hours"?', questionHi: '"Operating Hours" क्या हैं?', answerEn: 'The times when your store is active and processing orders.', answerHi: 'वह समय जब आपकी दुकान सक्रिय होती है और ऑर्डर प्रोसेस करती है।' },
      { questionEn: 'How do I set my timezone?', questionHi: 'मैं अपना टाइमज़ोन कैसे सेट करूँ?', answerEn: 'Go to Settings > Platform to adjust your local time preferences.', answerHi: 'सेटिंग्स > प्लेटफॉर्म में जाकर अपना टाइमज़ोन सेट करें।' },
      { questionEn: 'Is my business visible to Google?', questionHi: 'क्या मेरा बिज़नेस Google पर दिखता है?', answerEn: 'Only the public catalog pages are indexed for SEO visibility.', answerHi: 'हाँ, केवल सार्वजनिक कैटलॉग पेज ही सर्च में दिखते हैं।' },

      // 31-40: Store & Products
      { questionEn: 'How do I list a product?', questionHi: 'मैं प्रोडक्ट लिस्ट कैसे करूँ?', answerEn: 'Go to Store Dashboard > Catalog > Add Product.', answerHi: 'Store Dashboard > Catalog > Add Product पर जाएं।' },
      { questionEn: 'What is the image size limit?', questionHi: 'फोटो की साइज सीमा क्या है?', answerEn: 'Maximum 2MB per image; 1024x1024 resolution recommended.', answerHi: 'प्रति फोटो अधिकतम 2MB; 1024x1024 रेसोल्यूशन की सलाह दी जाती है।' },
      { questionEn: 'Can I set a product as "Featured"?', questionHi: 'क्या मैं प्रोडक्ट को "Featured" सेट कर सकता हूं?', answerEn: 'Yes, to pin it to the top of your store home page.', answerHi: 'हाँ, इसे अपने स्टोर के होम पेज पर सबसे ऊपर पिन करने के लिए।' },
      { questionEn: 'What is a "SKU"?', questionHi: '"SKU" क्या है?', answerEn: 'Stock Keeping Unit—a unique code for your internal inventory tracking.', answerHi: 'यह आपकी आंतरिक इन्वेंटरी ट्रैकिंग के लिए एक यूनिक कोड है।' },
      { questionEn: 'How do I handle out-of-stock items?', questionHi: 'स्टॉक खत्म होने पर क्या करें?', answerEn: 'Set stock to 0 or "Archive" the product to hide it from buyers.', answerHi: 'स्टॉक को 0 कर दें या प्रोडक्ट को "Archive" कर दें।' },
      { questionEn: 'Can I bulk-upload products?', questionHi: 'क्या मैं एक साथ कई प्रोडक्ट अपलोड कर सकता हूँ?', answerEn: 'Yes, using our CSV Import tool in the Catalog module.', answerHi: 'हाँ, कैटलॉग मॉड्यूल में CSV इंपोर्ट टूल का उपयोग करके।' },
      { questionEn: 'How do I categorize my items?', questionHi: 'मैं अपने सामान को कैसे वर्गीकृत करूँ?', answerEn: 'Select a primary and secondary category from the global list.', answerHi: 'ग्लोबल लिस्ट में से प्राइमरी और सेकेंडरी कैटेगरी चुनें।' },
      { questionEn: 'What is "Regional Pricing"?', questionHi: '"Regional Pricing" क्या है?', answerEn: 'The ability to set different Pi prices for different shipping zones.', answerHi: 'अलग-अलग शिपिंग जोन के लिए अलग-अलग Pi कीमतें सेट करने की क्षमता।' },
      { questionEn: 'Can I delete a product permanently?', questionHi: 'क्या मैं प्रोडक्ट को स्थायी रूप से हटा सकता हूँ?', answerEn: 'Yes, if it has no sales history. Otherwise, use "Archive".', answerHi: 'हाँ, यदि उसका कोई बिक्री इतिहास नहीं है। अन्यथा "Archive" का उपयोग करें।' },
      { questionEn: 'What is the product "Summary"?', questionHi: 'प्रोडक्ट "Summary" क्या है?', answerEn: 'A short 150-character description shown in the search results.', answerHi: 'सर्च रिज़ल्ट में दिखाया जाने वाला एक छोटा 150-शब्दों का विवरण।' },

      // 41-50: Orders & Fulfillment
      { questionEn: 'How do I mark an order as "Shipped"?', questionHi: 'मैं ऑर्डर को "Shipped" कैसे मार्क करूँ?', answerEn: 'Enter the Tracking ID in the Order Details page and click "Ship".', answerHi: 'ऑर्डर डिटेल्स पेज में ट्रैकिंग आईडी डालें और "Ship" पर क्लिक करें।' },
      { questionEn: 'Where do I get shipping labels?', questionHi: 'मुझे शिपिंग लेबल कहाँ से मिलेंगे?', answerEn: 'You can print standard labels directly from the fulfillment module.', answerHi: 'आप फुलफिलमेंट मॉड्यूल से सीधे स्टैंडर्ड लेबल प्रिंट कर सकते हैं।' },
      { questionEn: 'Can I cancel a "Shipped" order?', questionHi: 'क्या मैं "Shipped" ऑर्डर कैंसिल कर सकता हूँ?', answerEn: 'No. You must wait for the buyer to receive it and initiate a return.', answerHi: 'नहीं, आपको खरीदार द्वारा सामान प्राप्त होने और रिटर्न शुरू करने का इंतज़ार करना होगा।' },
      { questionEn: 'What is an "Order ID"?', questionHi: '"Order ID" क्या है?', answerEn: 'A unique alphanumeric code generated for every Pi transaction.', answerHi: 'हर Pi ट्रांजैक्शन के लिए जनरेट किया गया एक यूनिक कोड।' },
      { questionEn: 'How do I contact the buyer?', questionHi: 'मैं खरीदार से संपर्क कैसे करूँ?', answerEn: 'Use the "Inbox" icon inside the specific order detail view.', answerHi: 'ऑर्डर डिटेल व्यू के भीतर "Inbox" आइकन का उपयोग करें।' },
      { questionEn: 'What if the tracking number is wrong?', questionHi: 'अगर ट्रैकिंग नंबर गलत हो तो?', answerEn: 'Edit the order details within 12 hours to update the correct ID.', answerHi: 'सही आईडी अपडेट करने के लिए 12 घंटे के भीतर ऑर्डर विवरण बदलें।' },
      { questionEn: 'Can I partial-ship an order?', questionHi: 'क्या मैं आधा ऑर्डर शिप कर सकता हूँ?', answerEn: 'No. Each order ID represents a single shipping unit in our system.', answerHi: 'नहीं, हमारे सिस्टम में प्रत्येक ऑर्डर आईडी एक सिंगल शिपिंग यूनिट है।' },
      { questionEn: 'How do I handle product returns?', questionHi: 'मैं प्रोडक्ट रिटर्न को कैसे संभालूँ?', answerEn: 'Initiate the "Return Workflow" to pause escrow and verify the item.', answerHi: 'एस्क्रौ को रोकने और सामान सत्यापित करने के लिए "Return Workflow" शुरू करें।' },
      { questionEn: 'What is a "Packing Slip"?', questionHi: '"Packing Slip" क्या है?', answerEn: 'A document included inside the parcel listing all the items.', answerHi: 'पार्सल के अंदर रखा जाने वाला दस्तावेज़ जिसमें सभी सामानों की सूची होती है।' },
      { questionEn: 'Can I block certain countries?', questionHi: 'क्या मैं कुछ देशों को ब्लॉक कर सकता हूँ?', answerEn: 'Yes, in your Warehouse & Logistics settings under "Blacklist".', answerHi: 'हाँ, "Blacklist" के तहत अपनी वेयरहाउस सेटिंग्स में।' },

      // 51-60: Dashboard & Analytics
      { questionEn: 'How do I read the revenue chart?', questionHi: 'राजस्व चार्ट को कैसे समझें?', answerEn: 'It shows your gross earnings in Pi over selected time intervals.', answerHi: 'यह चयनित समय अंतराल में Pi में आपकी कुल कमाई दिखाता है।' },
      { questionEn: 'Can I export analytics to Excel?', questionHi: 'क्या मैं एनालिटिक्स को Excel में एक्सपोर्ट कर सकता हूँ?', answerEn: 'Yes, use the "Export CSV" button in the Analytics tab.', answerHi: 'हाँ, एनालिटिक्स टैब में "Export CSV" बटन का उपयोग करें।' },
      { questionEn: 'What is "Conversion Rate"?', questionHi: '"Conversion Rate" क्या है?', answerEn: 'The percentage of store visitors who complete a purchase.', answerHi: 'स्टोर पर आने वाले उन लोगों का प्रतिशत जो खरीदारी पूरी करते हैं।' },
      { questionEn: 'How do I hide sensitive stats?', questionHi: 'मैं संवेदनशील आंकड़े कैसे छुपाऊं?', answerEn: 'Toggle the "Eye" icon to activate Privacy Mode on your dashboard.', answerHi: 'अपने डैशबोर्ड पर प्राइवेसी मोड सक्रिय करने के लिए "Eye" आइकन दबाएं।' },
      { questionEn: 'Where is the "Heatmap"?', questionHi: '"Heatmap" कहाँ है?', answerEn: 'In the Inventory tab, showing regional stock distribution.', answerHi: 'इन्वेंटरी टैब में, क्षेत्रीय स्टॉक वितरण दिखाते हुए।' },
      { questionEn: 'What is "Average Order Value"?', questionHi: '"Average Order Value" क्या है?', answerEn: 'The mean amount of Pi spent per transaction in your store.', answerHi: 'आपकी दुकान में प्रति ट्रांजैक्शन खर्च की गई Pi की औसत राशि।' },
      { questionEn: 'Can I customize the dashboard layout?', questionHi: 'क्या मैं डैशबोर्ड लेआउट को कस्टमाइज़ कर सकता हूँ?', answerEn: 'Yes, drag and drop cards to reorder your priority metrics.', answerHi: 'हाँ, अपने मुख्य आंकड़ों को फिर से व्यवस्थित करने के लिए कार्ड्स को ड्रैग और ड्रॉप करें।' },
      { questionEn: 'What does "LTV" mean?', questionHi: '"LTV" का क्या मतलब है?', answerEn: 'Lifetime Value—the total amount a customer has spent with you.', answerHi: 'लाइफटाइम वैल्यू—एक ग्राहक ने आपके साथ कुल कितनी राशि खर्च की है।' },
      { questionEn: 'How often does data sync?', questionHi: 'डेटा कितनी बार सिंक होता है?', answerEn: 'Real-time sync occurs every 60 seconds automatically.', answerHi: 'हर 60 सेकंड में अपने आप रियल-टाइम सिंक होता है।' },
      { questionEn: 'Where can I see "Abandoned Carts"?', questionHi: '"Abandoned Carts" कहाँ देख सकते हैं?', answerEn: 'This feature is available for Enterprise-level merchants only.', answerHi: 'यह सुविधा केवल एंटरप्राइज-लेवल मर्चेंट्स के लिए उपलब्ध है।' },

      // 61-100: Errors, Safety, and Miscellaneous
      { questionEn: 'What is "Error 401: Unauthorized"?', questionHi: '"Error 401: Unauthorized" क्या है?', answerEn: 'Your login session has expired. Please refresh and log in again.', answerHi: 'आपका लॉगिन सेशन समाप्त हो गया है। कृपया रिफ्रेश करके फिर से लॉगिन करें।' },
      { questionEn: 'How do I report a scammer?', questionHi: 'मैं किसी स्कैमर की रिपोर्ट कैसे करूँ?', answerEn: 'Click the "Report" button on their profile or inside the chat.', answerHi: 'उनकी प्रोफाइल पर या चैट के अंदर "Report" बटन पर क्लिक करें।' },
      { questionEn: 'What is a "Trust Score"?', questionHi: '"Trust Score" क्या है?', answerEn: 'An automated rating based on your successful transactions and reviews.', answerHi: 'आपके सफल लेनदेन और समीक्षाओं के आधार पर एक स्वचालित रेटिंग।' },
      { questionEn: 'Is there a dark mode?', questionHi: 'क्या डार्क मोड है?', answerEn: 'Yes. Toggle it in Settings > Display.', answerHi: 'हाँ, सेटिंग्स > डिस्प्ले में जाकर इसे बदलें।' },
      { questionEn: 'Can I use a VPN?', questionHi: 'क्या मैं VPN इस्तेमाल कर सकता हूँ?', answerEn: 'VPNs are allowed but may trigger extra security verification.', answerHi: 'VPN की अनुमति है लेकिन इससे अतिरिक्त सुरक्षा सत्यापन हो सकता है।' },
      { questionEn: 'What is the "Arbitration" team?', questionHi: '"Arbitration" टीम क्या है?', answerEn: 'Our human moderators who resolve payment and return disputes.', answerHi: 'हमारे मॉडरेटर्स जो भुगतान और रिटर्न विवादों को सुलझाते हैं।' },
      { questionEn: 'How do I update the app?', questionHi: 'मैं ऐप को अपडेट कैसे करूँ?', answerEn: 'As a web app, it updates automatically every time you reload.', answerHi: 'वेब ऐप होने के नाते, यह हर बार रिलोड होने पर अपने आप अपडेट होता है।' },
      { questionEn: 'Is my IP address tracked?', questionHi: 'क्या मेरा IP एड्रेस ट्रैक किया जाता है?', answerEn: 'Only for security purposes to prevent bot attacks.', answerHi: 'केवल बॉट हमलों को रोकने और सुरक्षा उद्देश्यों के लिए।' },
      { questionEn: 'What if I find a bug?', questionHi: 'अगर मुझे कोई बग मिले तो?', answerEn: 'Report it via the "Feedback" button in your dashboard footer.', answerHi: 'डैशबोर्ड फुटर में "Feedback" बटन के माध्यम से इसकी रिपोर्ट करें।' },
      { questionEn: 'Can I sell restricted items?', questionHi: 'क्या मैं प्रतिबंधित सामान बेच सकता हूँ?', answerEn: 'No. Check the "Prohibited Items" list in our Terms of Service.', answerHi: 'नहीं, हमारे सेवा की शर्तों में "प्रतिबंधित वस्तुओं" की सूची देखें।' }
    ]
  },

  // ==========================================
  // 23. LEGAL & COMPLIANCE - TERMS & CONDITIONS
  // ==========================================
  {
    id: 'terms-and-conditions',
    titleEn: 'Terms & Conditions',
    titleHi: 'नियम और शर्तें (Terms of Service)',
    categoryEn: 'Legal & Compliance',
    categoryHi: 'कानूनी और अनुपालन',
    badge: 'Legal',
    summaryEn: 'The legal framework governing your use of the platform, including escrow rules, merchant conduct, and dispute resolution.',
    summaryHi: 'प्लेटफॉर्म के उपयोग को नियंत्रित करने वाला कानूनी ढांचा, जिसमें एस्क्रौ नियम और विवाद समाधान शामिल हैं।',

    overviewEn: `These Terms & Conditions constitute a legally binding agreement between you and Pi Business Market. By accessing our Web3 marketplace, you agree to abide by our protocols regarding decentralized payments, cryptographic escrow, and professional merchant conduct. We prioritize the integrity of the Pi Network and ensure all participants are protected by fair usage policies.`,
    overviewHi: `ये नियम और शर्तें आपके और Pi Business Market के बीच एक कानूनी समझौता हैं। हमारे मार्केटप्लेस का उपयोग करके, आप हमारे पेमेंट प्रोटोकॉल और एस्क्रौ नियमों का पालन करने के लिए सहमत होते हैं।`,

    purposeEn: `To define the rights and responsibilities of all users (Buyers, Merchants, and Partners) to ensure a safe and transparent commercial environment.`,
    purposeHi: `सभी उपयोगकर्ताओं के अधिकारों और जिम्मेदारियों को परिभाषित करना।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'User Obligations',
        titleHi: 'उपयोगकर्ता के दायित्व',
        descriptionEn: 'Users must maintain a verified Pi Network account and refrain from any fraudulent activities or Sybil attacks.',
        descriptionHi: 'उपयोगकर्ताओं को एक सत्यापित Pi अकाउंट बनाए रखना चाहिए और धोखाधड़ी से बचना चाहिए।'
      },
      {
        stepNumber: 2,
        titleEn: 'Escrow Agreement',
        titleHi: 'एस्क्रौ समझौता',
        descriptionEn: 'By placing an order, buyers agree to lock Pi tokens in escrow. Merchants agree to fulfill orders within the specified SLA.',
        descriptionHi: 'ऑर्डर देने पर, खरीदार टोकन को एस्क्रौ में लॉक करने के लिए सहमत होते हैं।'
      },
      {
        stepNumber: 3,
        titleEn: 'Arbitration Clause',
        titleHi: 'मध्यस्थता क्लॉज',
        descriptionEn: 'In case of disputes, both parties agree to abide by the decision of the Pi Business Market arbitration team.',
        descriptionHi: 'विवाद की स्थिति में, दोनों पक्ष हमारी मध्यस्थता टीम के निर्णय को मानने के लिए सहमत होते हैं।'
      }
    ],

    benefitsEn: [
      'Clear legal protection for both buyers and sellers.',
      'Standardized fees (0.01 π) for all blockchain transactions.',
      'Transparency on data handling and privacy rights.',
      'Professional dispute resolution mechanism.'
    ],
    benefitsHi: [
      'खरीदारों और विक्रेताओं दोनों के लिए स्पष्ट कानूनी सुरक्षा।',
      'सभी लेनदेन के लिए मानकीकृत फीस (0.01 π)।',
      'डेटा हैंडलिंग और गोपनीयता अधिकारों पर पारदर्शिता।'
    ],

    tipsEn: [
      'Read the "Merchant Conduct" section if you plan to sell high-value electronics.',
      'Keep a record of your "Order IDs" for any legal inquiries.',
      'Review the "Prohibited Items" list monthly as it is updated with local regulations.'
    ],
    tipsHi: [
      'यदि आप महंगा सामान बेचने की योजना बना रहे हैं, तो "Merchant Conduct" सेक्शन पढ़ें।',
      'कानूनी पूछताछ के लिए अपने "Order IDs" का रिकॉर्ड रखें।'
    ],

    bestPracticesEn: [
      'Always use the official platform chat for negotiations to ensure legal evidence in disputes.',
      'Honest disclosure: Clearly state product conditions to avoid "Not as Described" legal claims.',
      'Regularly review these terms as they evolve with the Pi Mainnet milestones.'
    ],
    bestPracticesHi: [
      'विवादों में कानूनी सबूत सुनिश्चित करने के लिए हमेशा आधिकारिक चैट का उपयोग करें।',
      'कानूनी दावों से बचने के लिए प्रोडक्ट की स्थिति को स्पष्ट रूप से बताएं।'
    ],

    notesEn: [
      'Liability: The platform is not responsible for physical goods quality but strictly enforces payment safety.',
      'Jurisdiction: These terms are governed by international Web3 and decentralized commerce standards.',
      'Updates: Significant changes to these terms will be announced via the Notification Center.'
    ],
    notesHi: [
      'जिम्मेदारी: प्लेटफॉर्म माल की गुणवत्ता के लिए नहीं बल्कि भुगतान सुरक्षा के लिए जिम्मेदार है।'
    ],

    faqs: [
      {
        questionEn: 'Are these terms legally binding?',
        questionHi: 'क्या ये शर्तें कानूनी रूप से बाध्यकारी हैं?',
        answerEn: 'Yes, your digital signature via the Pi Wallet login constitutes acceptance of these terms.',
        answerHi: 'हाँ, Pi वॉलेट लॉगिन के माध्यम से आपके डिजिटल हस्ताक्षर इन शर्तों की स्वीकृति माने जाते हैं।'
      },
      {
        questionEn: 'What if I disagree with the terms?',
        questionHi: 'अगर मैं शर्तों से असहमत हूं तो क्या होगा?',
        answerEn: 'If you disagree, you must stop using the platform and delete your business profile.',
        answerHi: 'यदि आप असहमत हैं, तो आपको प्लेटफॉर्म का उपयोग बंद करना होगा।'
      }
    ],
    keywords: ['legal', 'terms', 'conditions', 'arbitration', 'agreement', 'escrow rules', 'compliance'],
    relatedSectionIds: ['privacy-policy', 'escrow-payments-safety', 'welcome']
  },

  // ==========================================
  // 24. DEVELOPER RESOURCES - ENTERPRISE DOCS
  // ==========================================
  {
    id: 'enterprise-developer-docs',
    titleEn: 'Enterprise Developer Documentation',
    titleHi: 'एंटरप्राइज डेवलपर गाइड (Technical Docs)',
    categoryEn: 'Developer Resources',
    categoryHi: 'डेवलपर संसाधन',
    badge: 'Advanced',
    summaryEn: 'Deep-dive for engineers: Architecture, Folder structure, Firebase integration, Pi SDK, and Security rules.',
    summaryHi: 'इंजीनियर्स के लिए गहराई से जानकारी: आर्किटेक्चर, फोल्डर संरचना, Firebase और Pi SDK एकीकरण।',

    overviewEn: `The Enterprise Developer Documentation is the definitive guide for engineers looking to build on top of or maintain the Pi Business Market. It details our full-stack React + Express architecture, our decentralized authentication flow using the Pi Network SDK, and our cloud persistence strategy with Firebase Firestore. This documentation ensures that the system remains scalable, secure, and performant.`,
    overviewHi: `एंटरप्राइज डेवलपर डॉक्यूमेंटेशन उन इंजीनियर्स के लिए है जो Pi Business Market को मेंटेन करना चाहते हैं। यह हमारे फुल-स्टैक रिएक्ट + एक्सप्रेस आर्किटेक्चर और Pi SDK एकीकरण का विवरण देता है।`,

    purposeEn: `To provide a technical roadmap for system maintainers and enterprise partners to ensure code consistency and security.`,
    purposeHi: `कोड स्थिरता और सुरक्षा सुनिश्चित करने के लिए सिस्टम मेंटेनर्स को तकनीकी रोडमैप प्रदान करना।`,

    howItWorksSteps: [
      {
        stepNumber: 1,
        titleEn: 'Architecture Overview',
        titleHi: 'आर्किटेक्चर ओवरव्यू',
        descriptionEn: 'Frontend: React 18, Vite, Tailwind. Backend: Express.js (Node.js). Database: Firestore (NoSQL).',
        descriptionHi: 'फ्रंटएंड: रिएक्ट 18, वाइट, टेलविंड। बैकएंड: एक्सप्रेस (नोड)। डेटाबेस: फायरस्टोर।'
      },
      {
        stepNumber: 2,
        titleEn: 'Authentication Flow',
        titleHi: 'प्रमाणीकरण वर्कफ़्लो',
        descriptionEn: 'Client triggers Pi.authenticate(). Server verifies the accessToken via Pi Network API and issues a JWT.',
        descriptionHi: 'क्लाइंट Pi.authenticate() को ट्रिगर करता है। सर्वर Pi नेटवर्क API के माध्यम से टोकन सत्यापित करता है।'
      },
      {
        stepNumber: 3,
        titleEn: 'Security Rules',
        titleHi: 'सुरक्षा नियम (Firestore)',
        descriptionEn: 'Granular RBAC implemented via Firestore Security Rules (e.g., allow write: if request.auth.uid == resource.data.ownerId).',
        descriptionHi: 'Firestore सुरक्षा नियमों के माध्यम से विस्तृत एक्सेस कंट्रोल लागू किया गया है।'
      }
    ],

    benefitsEn: [
      'Modular folder structure for high maintainability.',
      'Strict TypeScript implementation for type-safe operations.',
      'Optimized Firebase queries for low latency.',
      'Comprehensive audit logging for all critical API routes.'
    ],
    benefitsHi: [
      'बेहतर मेंटेनेंस के लिए मॉड्यूलर फोल्डर संरचना।',
      'टाइप-सेफ ऑपरेशंस के लिए सख्त टाइपस्क्रिप्ट कार्यान्वयन।',
      'कम लेटेन्सी के लिए अनुकूलित फायरबेस क्वेरीज।'
    ],

    tipsEn: [
      'Folder Structure: Core logic is in /src/components (UI), /src/hooks (State), and /src/data (Static/Mock Data).',
      'Environment Variables: Ensure VITE_FIREBASE_API_KEY and PI_API_KEY are configured in the dashboard before deployment.',
      'Database: Collections use descriptive names (e.g., "businesses", "stores", "orders") with sub-collection nesting for CRM.'
    ],
    tipsHi: [
      'फोल्डर संरचना: मुख्य लॉजिक /src/components और /src/hooks में है।',
      'डेटाबेस: कलेक्शन्स वर्णनात्मक नामों (जैसे "businesses", "orders") का उपयोग करते हैं।'
    ],

    bestPracticesEn: [
      'Code Review: All changes to /src/db/schema.ts must be audited by the Lead Architect.',
      'Error Handling: Use the global ErrorBoundary component to catch and log frontend exceptions.',
      'Performance: Debounce all search inputs and use React.memo for high-frequency dashboard components.'
    ],
    bestPracticesHi: [
      'प्रदर्शन: सभी सर्च इनपुट्स को डिबाउंस (Debounce) करें और डैशबोर्ड कंपोनेंट्स के लिए React.memo का उपयोग करें।'
    ],

    notesEn: [
      'Deployment: Production builds are generated via "npm run build" and served via Nginx in the Cloud Run container.',
      'Pi SDK: Always use the latest version of the Pi JavaScript SDK for Mainnet compatibility.',
      'Analytics: Performance metrics are logged to Firebase Analytics for business intelligence.'
    ],
    notesHi: [
      'परिनियोजन (Deployment): "npm run build" के माध्यम से प्रोडक्शन बिल्ड जनरेट किए जाते हैं।'
    ],

    faqs: [
      {
        questionEn: 'How do I add a new API route?',
        questionHi: 'मैं नया API रूट कैसे जोड़ूँ?',
        answerEn: 'Add the endpoint in server.ts (development) or the corresponding microservice in the enterprise production branch.',
        answerHi: 'डेवलपमेंट के लिए server.ts में एंडपॉइंट जोड़ें।'
      },
      {
        questionEn: 'Is the data encrypted at rest?',
        questionHi: 'क्या डेटा एन्क्रिप्टेड है?',
        answerEn: 'Yes, Google Cloud (Firestore) provides automatic encryption at rest for all stored documents.',
        answerHi: 'हाँ, Google Cloud (Firestore) सभी संग्रहीत दस्तावेज़ों के लिए ऑटोमैटिक एन्क्रिप्शन प्रदान करता है।'
      }
    ],
    keywords: ['architecture', 'firebase', 'pi sdk', 'firestore', 'deployment', 'api', 'security', 'technical', 'developer', 'enterprise'],
    relatedSectionIds: ['system-architecture', 'welcome', 'terms-and-conditions']
  }
];

export const docCategories = Array.from(new Set(DOCUMENTATION_DATA.map(doc => doc.categoryEn))).sort();
