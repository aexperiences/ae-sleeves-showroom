/* ============================================================================
   SLEEVES OS — SHOWROOM ENGINE
   Tattoo Studio OS · Powered by Accelerated Experiences LLC

   BROWSER-ONLY. Business data lives in this browser's localStorage.

   Vertical grounding — why a booking app cannot run a tattoo studio:
     • The unit of work is an ASYNCHRONOUS APPROVAL, not a booking. Request →
       artist review → quote → deposit → only then a calendar slot. A client
       cannot self-serve a time, because the artist has to decide whether the
       piece is in their style, physically possible, and how long it will take.
     • The DEPOSIT is the business model. The artist draws for hours before
       anyone sits down; a no-show with no deposit held is half a day gone.
       Nothing gets a slot until the deposit is taken, and it credits the final.
     • FLASH IS ONE-OF-ONE INVENTORY. A flash design is tattooed once. The
       moment it is claimed it must retire itself, or two people are promised
       the same drawing.
     • CONSENT IS PER SESSION, not once ever — health screening, liability
       waiver, photo release and ID. No consent, no needle.
     • THE MONEY SPLITS AT THE CHAIR. Most artists rent a booth: the shop takes
       a percentage and the artist keeps the rest, on every single session.
     • TOUCH-UPS ARE FREE and cost real money — the tattoo equivalent of a
       warranty callback, and nobody measures it.

   Benchmarks ship SOURCED-OR-BLANK (Art. IV).
   ============================================================================ */
(function (global) {
  "use strict";

  var KEY = "sleeves_os_v1";
  var STORE = (function(){ try{ localStorage.setItem('_t','1'); localStorage.removeItem('_t'); return localStorage; }catch(e){ return sessionStorage; } })();
  /* local noon — a UTC-midnight date reads as the previous day west of Greenwich */
  var TODAY = new Date("2026-07-27T12:00:00");

  function now(){ return Date.now(); }
  function iso(d){ var m=d.getMonth()+1, day=d.getDate();
    return d.getFullYear()+"-"+(m<10?"0":"")+m+"-"+(day<10?"0":"")+day; }
  function addDays(d,n){ var x=new Date(d.getTime()); x.setDate(x.getDate()+n); return x; }
  function addMonths(d,n){ var x=new Date(d.getTime()); x.setMonth(x.getMonth()+n); return x; }
  function read(){ try{ var d=JSON.parse(STORE.getItem(KEY)); return d||null; }catch(e){ return null; } }
  function write(d){ d._t=now(); try{ STORE.setItem(KEY, JSON.stringify(d)); }catch(e){} }
  function clone(a){ return JSON.parse(JSON.stringify(a)); }
  var WEEK_START=(function(){ var d=new Date(TODAY.getTime()); d.setDate(d.getDate()-d.getDay()); return d; })();

  function fresh(){
    return { _t:now(), started:now(), sample:true, tier:"grandsuite", adds:[], offs:[],
      shop:clone(SEED.shop), artists:clone(SEED.artists), clients:clone(SEED.clients),
      requests:clone(SEED.requests), sessions:clone(SEED.sessions), flash:clone(SEED.flash),
      documents:clone(SEED.documents), systems:clone(SEED.systems),
      approvals:clone(SEED.approvals), bus:[], seq:1 };
  }
  function emptyBook(){ var d=fresh(); d.sample=false;
    d.artists=[]; d.clients=[]; d.requests=[]; d.sessions=[]; d.flash=[];
    d.documents=[]; d.approvals=[]; d.bus=[]; return d; }
  function goLive(){ var d=emptyBook(); write(d); return d; }
  function isSample(){ return db().sample!==false; }
  function db(){ var d=read(); if(!d){ d=fresh(); write(d); return d; } return d; }
  function save(mut){ var d=db(); mut(d); write(d); return d; }

  /* ====================================================================
     INDUSTRY CANON
     ==================================================================== */
  var STYLES = [
    { k:"American traditional", color:"#b8324a" },
    { k:"Neo-traditional",      color:"#c9553c" },
    { k:"Black & grey realism", color:"#5b5670" },
    { k:"Fine line",            color:"#7a8fa8" },
    { k:"Japanese / irezumi",   color:"#2e6b45" },
    { k:"Blackwork",            color:"#332a44" },
    { k:"Script / lettering",   color:"#8a6d3b" },
    { k:"Colour illustrative",  color:"#7a5aa8" },
    { k:"Cover-up",             color:"#a0522d" }
  ];
  function styleColor(k){ var s=STYLES.filter(function(x){return x.k===k;})[0]; return s?s.color:"#8d84a0"; }

  var PLACEMENTS = ["Inner forearm","Outer forearm","Upper arm","Full sleeve","Half sleeve",
    "Shoulder","Back piece","Chest","Ribs","Thigh","Calf","Ankle","Hand","Neck","Sternum","Spine"];

  /* Placements many shops decline on a first-timer or without conditions.
     Naming them is not squeamishness — it is the conversation that prevents a
     regretted, hard-to-cover tattoo and a bad review. */
  var PLACEMENT_FLAGS = {
    "Hand":"Job-stopper. Many shops require existing visible work or decline outright.",
    "Neck":"Job-stopper. Same conversation as hands.",
    "Sternum":"High pain, uneven healing. Set expectations before booking.",
    "Ribs":"High pain, long sittings. Budget more time than the drawing suggests.",
    "Spine":"High pain. Plan multiple shorter sessions."
  };

  var SESSION_TYPES = ["Consultation","First session","Continuation","Single sitting","Touch-up","Cover-up consult"];

  /* THE PIPELINE. This is the product. A generic booking tool starts at
     "pick a time"; this starts four steps earlier. */
  var STAGES = ["New request","Under review","Quoted","Deposit due","Booked","In progress","Healed","Declined"];
  function stageIndex(s){ return STAGES.indexOf(s); }

  /* Health screening — the questions that actually change whether you tattoo
     someone today, and what the artist does about each answer. */
  var HEALTH = [
    { k:"Under 18",                  block:true,  why:"Minors are not tattooed. In most states this is not waivable, with or without a parent present." },
    { k:"Pregnant or nursing",       block:true,  why:"Standard industry refusal. Reschedule, do not negotiate." },
    { k:"Under the influence today", block:true,  why:"Cannot give informed consent, and alcohol thins the blood. Reschedule." },
    { k:"Blood thinners",            block:false, why:"Excess bleeding pushes ink out and greys the result. Requires a physician note." },
    { k:"Diabetes",                  block:false, why:"Slower healing. Shorter sessions, extra aftercare instruction." },
    { k:"Haemophilia / clotting disorder", block:true, why:"Refer to a physician before any work." },
    { k:"Keloid scarring history",   block:false, why:"Discuss placement and realistic outcome; document the conversation." },
    { k:"Latex allergy",             block:false, why:"Nitrile only. Flag it on the booking so the station is set up right." },
    { k:"Recent sunburn at the site",block:false, why:"Do not tattoo broken or burned skin. Reschedule." },
    { k:"Heart condition / pacemaker", block:false, why:"Coil machines and some equipment need consideration. Get clearance." },
    { k:"Epilepsy",                  block:false, why:"Know the plan before the needle starts." }
  ];
  function healthBlockers(flags){
    return (flags||[]).map(function(f){ return HEALTH.filter(function(h){return h.k===f;})[0]; })
      .filter(function(h){ return h && h.block; });
  }

  /* Consent is per SESSION. Many shops require a fresh form every visit because
     health facts change and the waiver has to name that day's work. */
  var CONSENT_ITEMS = [
    "Photo ID checked and on file",
    "Health screening completed today",
    "Liability waiver signed for this session",
    "Aftercare instructions given",
    "Photo / portfolio release (optional)"
  ];

  /* Artist credentials. A lapsed bloodborne card is a shop-closing finding. */
  var CREDS = [
    { k:"Bloodborne pathogen cert", required:true,  cycleMo:12, note:"Annual. Health-department inspectable." },
    { k:"First aid / CPR",          required:true,  cycleMo:24, note:"Two-year certification." },
    { k:"Shop artist licence",      required:true,  cycleMo:12, note:"State or county artist registration." },
    { k:"Hepatitis B vaccination",  required:false, cycleMo:0,  note:"Strongly recommended; documented once." }
  ];
  var CRED_WARN_DAYS = 45;

  /* THE MONEY. Draft shop policy — the numbers a studio actually argues about. */
  var RATES = {
    depositMin:      100,    // minimum to hold any slot
    depositPctOfQuote: 0.20, // or 20% of the quote, whichever is greater
    depositCredits:  true,   // it comes off the final price, it is not a fee
    shopCutPct:      0.30,   // chair rental: the shop's share of each session
    suppliesPerHour: 12.00,  // needles, ink, cartridges, barriers, per hour
    minimumCharge:   140.00, // the shop minimum for any tattoo, however small
    touchUpDays:     60      // free touch-up window after the session heals
  };

  var BENCH = {
    depositNoShowPct: { value:null, note:"Not yet sourced — track your own baseline." },
    quoteWinPct:      { value:null, note:"Not yet sourced." },
    touchUpPct:       { value:null, note:"Not yet sourced." },
    rebookPct:        { value:null, note:"Not yet sourced." }
  };
  var REPLACES = ["Instagram DMs as an intake system","Booking / calendar tool","Deposit collection (Venmo, cash app)",
    "Paper waivers on a clipboard","Flash sheets in a binder","Aftercare follow-up by memory","Booth-rent accounting spreadsheet"];

  /* ====================================================================
     SEED — Ravenwood Tattoo Collective, Coeur d'Alene, Idaho.
     Five artists on booth rent, a real request queue, and a flash wall.
     ==================================================================== */
  function credOn(m){ return iso(addMonths(TODAY,m)); }
  var SEED = {};

  SEED.shop = { name:"Ravenwood Tattoo Collective", city:"Coeur d'Alene", state:"ID",
    licence:"ID-TAT-0000 (enter your registration)", owner:"Mira Halloway",
    phone:"(208) 555-0310", instagram:"@ravenwoodtattoo",
    hours:"Tue–Sat, 12–8p · closed Sun/Mon", holidays:["2026-07-04","2026-11-26","2026-12-25"] };

  SEED.artists = [
    { id:"ar1", name:"Mira Halloway", handle:"@mira.ink", booth:"Station 1", status:"Active",
      styles:["American traditional","Neo-traditional","Cover-up"], rate:180, dayRate:1200,
      shopCut:0, owner:true, since:"2016-05-02", rating:5.0,
      creds:{ "Bloodborne pathogen cert":credOn(7), "First aid / CPR":credOn(15),
              "Shop artist licence":credOn(9), "Hepatitis B vaccination":"complete" } },
    { id:"ar2", name:"Dez Okonkwo", handle:"@dez.blackwork", booth:"Station 2", status:"Active",
      styles:["Blackwork","Japanese / irezumi"], rate:170, dayRate:1150,
      shopCut:0.30, owner:false, since:"2019-09-14", rating:4.9,
      creds:{ "Bloodborne pathogen cert":credOn(3), "First aid / CPR":credOn(11),
              "Shop artist licence":credOn(5), "Hepatitis B vaccination":"complete" } },
    { id:"ar3", name:"Saoirse Bell", handle:"@saoirse.fineline", booth:"Station 3", status:"Active",
      styles:["Fine line","Script / lettering"], rate:150, dayRate:1000,
      shopCut:0.30, owner:false, since:"2022-03-08", rating:4.8,
      creds:{ "Bloodborne pathogen cert":credOn(-1), "First aid / CPR":credOn(8),
              "Shop artist licence":credOn(13), "Hepatitis B vaccination":"complete" } },
    { id:"ar4", name:"Ruben Castellanos", handle:"@ruben.bng", booth:"Station 4", status:"Active",
      styles:["Black & grey realism","Cover-up"], rate:190, dayRate:1300,
      shopCut:0.30, owner:false, since:"2020-11-19", rating:4.9,
      creds:{ "Bloodborne pathogen cert":credOn(1), "First aid / CPR":credOn(19),
              "Shop artist licence":credOn(2), "Hepatitis B vaccination":"complete" } },
    { id:"ar5", name:"Wren Ashby", handle:"@wren.colour", booth:"Station 5", status:"Apprentice",
      styles:["Colour illustrative"], rate:90, dayRate:600,
      shopCut:0.50, owner:false, since:"2026-02-02", rating:null,
      creds:{ "Bloodborne pathogen cert":credOn(10), "First aid / CPR":credOn(14),
              "Shop artist licence":credOn(16) } }
  ];

  SEED.clients = [
    { id:"cl1", name:"Tegan Moreau", phone:"(208) 555-0401", age:31, idOnFile:true,
      health:[], existing:"Half sleeve left arm (ours, 2024)", since:"2024-04-11", note:"" },
    { id:"cl2", name:"Jonah Pike", phone:"(208) 555-0402", age:27, idOnFile:true,
      health:["Diabetes"], existing:"None", since:"2026-06-02", note:"First tattoo. Nervous, talk him through it." },
    { id:"cl3", name:"Ines Vartanian", phone:"(208) 555-0403", age:44, idOnFile:true,
      health:["Blood thinners"], existing:"Back piece (other shop)", since:"2025-01-20",
      note:"On warfarin — physician note required before any long sitting." },
    { id:"cl4", name:"Brody Lachance", phone:"(208) 555-0404", age:19, idOnFile:true,
      health:[], existing:"Small script forearm", since:"2026-05-30", note:"Wants hand work — have the job-stopper talk." },
    { id:"cl5", name:"Odalys Ferrer", phone:"(208) 555-0405", age:36, idOnFile:true,
      health:["Latex allergy"], existing:"Full sleeve right (ours, in progress)", since:"2025-08-15",
      note:"Nitrile only. Station set up accordingly." },
    { id:"cl6", name:"Kit Sandoval", phone:"(208) 555-0406", age:23, idOnFile:false,
      health:[], existing:"None", since:"2026-07-24", note:"ID not yet on file — must check at the door." },
    { id:"cl7", name:"Marguerite Loeb", phone:"(208) 555-0407", age:52, idOnFile:true,
      health:["Keloid scarring history"], existing:"Two small pieces", since:"2026-03-11",
      note:"Keloid history — placement discussion documented." },
    { id:"cl8", name:"Ash Dunmore", phone:"(208) 555-0408", age:17, idOnFile:true,
      health:["Under 18"], existing:"None", since:"2026-07-26",
      note:"SEVENTEEN. Cannot be tattooed. Told to come back after their birthday in November." }
  ];

  /* The request queue — what replaces the Instagram DM blackhole. */
  SEED.requests = [
    { id:"rq1", clientId:"cl2", artistId:"ar1", stage:"Deposit due",
      style:"American traditional", placement:"Outer forearm", sizeIn:6, budget:600,
      refs:3, received:iso(addDays(TODAY,-2)), quote:540, depositPaid:0,
      desc:"Traditional swallow with a banner, his grandmother's initials." },
    { id:"rq2", clientId:"cl5", artistId:"ar2", stage:"Booked",
      style:"Japanese / irezumi", placement:"Full sleeve", sizeIn:0, budget:6000,
      refs:11, received:iso(addDays(TODAY,-58)), quote:5800, depositPaid:600,
      desc:"Continuation of the right sleeve — koi and waves, session 4 of ~7." },
    { id:"rq3", clientId:"cl4", artistId:"ar3", stage:"Under review",
      style:"Fine line", placement:"Hand", sizeIn:3, budget:350, refs:2,
      received:iso(addDays(TODAY,-1)), quote:0, depositPaid:0,
      desc:"Small fine-line moth across the back of the hand." },
    { id:"rq4", clientId:"cl1", artistId:"ar4", stage:"Quoted",
      style:"Black & grey realism", placement:"Thigh", sizeIn:9, budget:1400,
      refs:6, received:iso(addDays(TODAY,-5)), quote:1330, depositPaid:0,
      desc:"Portrait of her late dog from three reference photos." },
    { id:"rq5", clientId:"cl7", artistId:"ar1", stage:"New request",
      style:"Neo-traditional", placement:"Upper arm", sizeIn:5, budget:700,
      refs:4, received:iso(TODAY), quote:0, depositPaid:0,
      desc:"Neo-traditional peony, colour, upper arm." },
    { id:"rq6", clientId:"cl3", artistId:"ar4", stage:"Under review",
      style:"Cover-up", placement:"Back piece", sizeIn:14, budget:2500,
      refs:5, received:iso(addDays(TODAY,-4)), quote:0, depositPaid:0,
      desc:"Cover an old tribal piece. Multiple sittings expected." },
    { id:"rq7", clientId:"cl8", artistId:"ar3", stage:"Declined",
      style:"Fine line", placement:"Ankle", sizeIn:2, budget:200, refs:1,
      received:iso(addDays(TODAY,-1)), quote:0, depositPaid:0,
      desc:"DECLINED — client is 17. Invited back after their birthday." },
    { id:"rq8", clientId:"cl6", artistId:"ar5", stage:"Deposit due",
      style:"Colour illustrative", placement:"Calf", sizeIn:7, budget:800,
      refs:4, received:iso(addDays(TODAY,-3)), quote:720, depositPaid:0,
      desc:"Colour mushroom scene, calf. Apprentice rate." }
  ];

  SEED.sessions = (function(){
    var out=[], n=1;
    function S(off,clientId,artistId,type,start,hrs,price,depApplied,consent,status,note,touch){
      var d=iso(addDays(WEEK_START,off));
      out.push({ id:"s"+(n++), clientId:clientId, artistId:artistId, date:d, start:start,
        hours:hrs, type:type, price:price, depositApplied:depApplied||0,
        consent: consent||[], status:status, note:note||"", touchUp:!!touch });
    }
    /* last week — closed work */
    S(-5,"cl5","ar2","Continuation","13:00",6,1020,0,CONSENT_ITEMS.slice(0,4),"Complete","Sleeve session 3.",false);
    S(-4,"cl1","ar1","Single sitting","12:00",3,540,100,CONSENT_ITEMS.slice(0,4),"Complete","",false);
    S(-3,"cl7","ar3","Single sitting","15:00",2,300,100,CONSENT_ITEMS.slice(0,3),"Complete","No photo release given.",false);
    S(-2,"cl1","ar1","Touch-up","12:00",1,0,0,CONSENT_ITEMS.slice(0,4),"Complete","Free touch-up inside the window.",true);
    /* this week */
    S(1,"cl5","ar2","Continuation","13:00",6,1020,0,[],"Booked","Sleeve session 4.",false);
    S(2,"cl2","ar1","First session","14:00",3,540,0,[],"Booked","First tattoo — deposit NOT yet taken.",false);
    S(3,"cl3","ar4","Consultation","12:00",1,0,0,[],"Booked","Cover-up consult. Needs physician note re: warfarin.",false);
    S(4,"cl6","ar5","Single sitting","13:00",4,720,0,[],"Booked","ID not on file yet.",false);
    S(5,"cl7","ar1","Single sitting","12:00",3,600,100,[],"Booked","",false);
    S(3,"cl4","ar3","Single sitting","15:00",2,300,100,[],"Booked","Artist\u2019s bloodborne cert is EXPIRED \u2014 must be moved.",false);
    S(6,"cl2","ar3","Single sitting","14:00",2,320,100,[],"Booked","Same \u2014 blocked artist.",false);
    S(5,"cl1","ar4","Single sitting","16:00",4,760,150,[],"Booked","",false);
    S(6,"cl5","ar2","Touch-up","12:00",1,0,0,[],"Booked","Free touch-up.",true);
    return out;
  })();

  /* Flash — one-of-one inventory. */
  SEED.flash = [
    { id:"fl1", artistId:"ar1", title:"Swallow & banner",     style:"American traditional", price:280, sizeIn:5, status:"Available", claimedBy:null },
    { id:"fl2", artistId:"ar1", title:"Dagger through rose",  style:"American traditional", price:340, sizeIn:6, status:"Claimed",   claimedBy:"cl4" },
    { id:"fl3", artistId:"ar1", title:"Panther head",         style:"American traditional", price:400, sizeIn:7, status:"Tattooed",  claimedBy:"cl1" },
    { id:"fl4", artistId:"ar2", title:"Wave & koi (small)",   style:"Japanese / irezumi",   price:520, sizeIn:8, status:"Available", claimedBy:null },
    { id:"fl5", artistId:"ar2", title:"Blackwork moth",       style:"Blackwork",            price:300, sizeIn:5, status:"Available", claimedBy:null },
    { id:"fl6", artistId:"ar3", title:"Fine-line fern",       style:"Fine line",            price:180, sizeIn:4, status:"Tattooed",  claimedBy:"cl7" },
    { id:"fl7", artistId:"ar3", title:"Script — 'hold fast'", style:"Script / lettering",   price:200, sizeIn:5, status:"Available", claimedBy:null },
    { id:"fl8", artistId:"ar4", title:"Grey-wash skull",      style:"Black & grey realism", price:560, sizeIn:8, status:"Available", claimedBy:null },
    { id:"fl9", artistId:"ar5", title:"Colour toadstool",     style:"Colour illustrative",  price:220, sizeIn:4, status:"Available", claimedBy:null }
  ];

  SEED.systems = [
    { k:"Request intake & review", state:"Native", note:"This OS. Structured intake with references, placement, size and budget — it replaces the DM." },
    { k:"Quoting & deposits",      state:"Native", note:"This OS computes the quote and the deposit, and gates the calendar on it." },
    { k:"Flash inventory",         state:"Native", note:"This OS. One-of-one, retires itself when claimed." },
    { k:"Consent & health screening", state:"Native", note:"This OS. Per session, with the blocking conditions enforced." },
    { k:"Booth-rent splits",       state:"Native", note:"This OS. Shop cut and artist net computed on every session." },
    { k:"E-signature",             state:"Native", note:"This OS. Waivers signed on a phone at the door." },
    { k:"Taking the deposit",      state:"Vendor", note:"Moving money needs a licensed processor. The OS computes and authorises; the processor charges the card." },
    { k:"Instagram posting",       state:"Vendor", note:"Publishing to Instagram uses Meta's own API. Pulling a DM into the request queue is a manual paste today." },
    { k:"Health-department filing", state:"Vendor", note:"Inspection records are filed with the county. The OS keeps them audit-ready; the county holds the record." }
  ];

  SEED.approvals = [
    { id:"ap_1", title:"Decline the hand piece for Brody Lachance",
      dept:"Front of house", why:"19, one small tattoo, asking for the back of the hand. Job-stopper conversation not yet had.",
      impact:"Loses a $350 booking. Protects the client and the shop's portfolio.",
      stage:"Awaiting Anthony", conf:79, tags:["client"] },
    { id:"ap_2", title:"Pull Saoirse Bell off the books — bloodborne cert expired",
      dept:"Compliance", why:"Annual bloodborne pathogen certification lapsed. This is a health-department inspectable item.",
      impact:"She cannot be scheduled until it is renewed. Two booked sessions need moving.",
      stage:"Awaiting Anthony", conf:97, tags:["compliance","revenue"] },
    { id:"ap_3", title:"Raise the shop minimum $140 → $160",
      dept:"Money", why:"Supplies and station turnover cost more than they did when the minimum was set.",
      impact:"Applies to every small piece. Roughly +$600/mo at current volume.",
      stage:"Awaiting Anthony", conf:71, tags:["revenue"] },
    { id:"ap_4", title:"Send the Vartanian cover-up quote — $2,500",
      dept:"Front of house", why:"Consult booked, references in, artist has scoped multiple sittings.",
      impact:"Largest open quote. Requires a physician note before the first long sitting.",
      stage:"Awaiting Anthony", conf:85, tags:["send"] }
  ];

  SEED.documents = [
    { id:"d1", tpl:"t_consent", title:"Consent, Health Screening & Waiver", subject:"Tegan Moreau", subjectId:"cl1",
      signer:{name:"Tegan Moreau",email:"t.moreau@example.com",role:"Client"},
      status:"Signed", created:iso(addDays(TODAY,-4)), sentTs:iso(addDays(TODAY,-4)), token:"SLV-6M2K-8Q4P",
      values:{name:"Tegan Moreau",date:iso(addDays(TODAY,-4)),ackScope:true},
      audit:[{ts:iso(addDays(TODAY,-4))+"T11:40:00",who:"Mira Halloway",what:"Document created from template"},
             {ts:iso(addDays(TODAY,-4))+"T11:41:12",who:"Mira Halloway",what:"Signer link minted for Tegan Moreau"},
             {ts:iso(addDays(TODAY,-4))+"T11:52:03",who:"Tegan Moreau",what:"Opened the signing link"},
             {ts:iso(addDays(TODAY,-4))+"T11:53:20",who:"Tegan Moreau",what:"Consented to do business electronically (ESIGN/UETA)"},
             {ts:iso(addDays(TODAY,-4))+"T11:53:44",who:"Tegan Moreau",what:"Adopted and applied signature — record frozen"}] },
    { id:"d2", tpl:"t_consent", title:"Consent, Health Screening & Waiver", subject:"Jonah Pike", subjectId:"cl2",
      signer:{name:"Jonah Pike",email:"j.pike@example.com",role:"Client · first session"},
      status:"Sent", created:iso(addDays(TODAY,-1)), sentTs:iso(addDays(TODAY,-1)), token:"SLV-3T9W-5B7N", values:{},
      audit:[{ts:iso(addDays(TODAY,-1))+"T09:10:00",who:"Mira Halloway",what:"Document created from template"},
             {ts:iso(addDays(TODAY,-1))+"T09:11:30",who:"Mira Halloway",what:"Signer link minted for Jonah Pike"}] },
    { id:"d3", tpl:"t_deposit", title:"Deposit Agreement", subject:"Jonah Pike", subjectId:"cl2",
      signer:{name:"Jonah Pike",email:"j.pike@example.com",role:"Client"},
      status:"Draft", created:iso(TODAY), sentTs:null, token:"SLV-1F5H-9D3C", values:{},
      audit:[{ts:iso(TODAY)+"T08:20:00",who:"Mira Halloway",what:"Document created from template — deposit not yet taken"}] },
    { id:"d4", tpl:"t_booth", title:"Booth Rental Agreement", subject:"Wren Ashby", subjectId:"ar5",
      signer:{name:"Wren Ashby",email:"w.ashby@example.com",role:"Apprentice artist"},
      status:"Signed", created:iso(addDays(TODAY,-176)), sentTs:iso(addDays(TODAY,-176)), token:"SLV-7K4R-2M8V",
      values:{name:"Wren Ashby",date:iso(addDays(TODAY,-175)),ackScope:true},
      audit:[{ts:iso(addDays(TODAY,-176))+"T14:00:00",who:"Mira Halloway",what:"Document created from template"},
             {ts:iso(addDays(TODAY,-175))+"T10:22:41",who:"Wren Ashby",what:"Adopted and applied signature — record frozen"}] }
  ];

  /* ====================================================================
     LOOKUPS
     ==================================================================== */
  function clientById(id){ return db().clients.filter(function(c){return c.id===id;})[0]||null; }
  function artistById(id){ return db().artists.filter(function(a){return a.id===id;})[0]||null; }
  function requestById(id){ return db().requests.filter(function(r){return r.id===id;})[0]||null; }
  function sessionById(id){ return db().sessions.filter(function(s){return s.id===id;})[0]||null; }
  function flashById(id){ return db().flash.filter(function(f){return f.id===id;})[0]||null; }
  function docById(id){ return db().documents.filter(function(d){return d.id===id;})[0]||null; }
  function docByToken(t){ return db().documents.filter(function(d){return d.token===t;})[0]||null; }
  function artistName(id){ var a=artistById(id); return a?a.name:"Unassigned"; }
  function clientName(id){ var c=clientById(id); return c?c.name:"—"; }
  function weekOf(dISO){ var d=new Date(dISO+"T12:00:00"); return iso(addDays(d,-d.getDay())); }
  function thisWeek(){ return iso(WEEK_START); }
  function lastWeek(){ return iso(addDays(WEEK_START,-7)); }
  function sessionsInWeek(wk){ return db().sessions.filter(function(s){ return weekOf(s.date)===(wk||thisWeek()); }); }
  function daysUntil(dISO){ if(!dISO||dISO==="complete") return null;
    return Math.round((new Date(dISO+"T12:00:00")-TODAY)/86400000); }

  /* ====================================================================
     THE DEPOSIT GATE — the anti-no-show mechanism, and the whole reason
     this is not a booking app.
     ==================================================================== */
  function depositDue(quote){
    var q=Number(quote)||0;
    return Math.max(RATES.depositMin, Math.round(q * RATES.depositPctOfQuote));
  }
  function depositHeld(req){ return Number(req && req.depositPaid) || 0; }
  function depositSatisfied(req){
    if(!req) return false;
    if(!req.quote) return false;
    return depositHeld(req) >= depositDue(req.quote);
  }
  /* A session that exists WITHOUT a satisfied deposit is the shop's exposure.
     Most studios discover this the morning someone does not turn up. */
  function unprotectedSessions(wk){
    return sessionsInWeek(wk||thisWeek()).filter(function(s){
      if(s.type==="Consultation" || s.touchUp) return false;   // neither takes a deposit
      if(s.status!=="Booked") return false;
      if((s.depositApplied||0) > 0) return false;
      var req=db().requests.filter(function(r){ return r.clientId===s.clientId && r.artistId===s.artistId; })[0];
      return !depositSatisfied(req);
    });
  }
  function exposedValue(wk){
    return unprotectedSessions(wk).reduce(function(a,s){ return a+(s.price||0); },0);
  }
  function takeDeposit(reqId, amount){
    return save(function(d){
      var r=d.requests.filter(function(x){return x.id===reqId;})[0]; if(!r) return;
      r.depositPaid = (r.depositPaid||0) + (Number(amount)|| depositDue(r.quote));
      if(depositSatisfied(r) && stageIndex(r.stage) < stageIndex("Booked")) r.stage="Booked";
      logBus(d,"Front of house","Deposit taken for "+clientName(r.clientId)+" — the slot is now held.");
    });
  }

  /* ====================================================================
     THE CONSENT GATE — no consent, no needle
     ==================================================================== */
  function consentMissing(s){
    if(!s) return [];
    var required=CONSENT_ITEMS.filter(function(i){ return i.indexOf("optional")<0; });
    var have=s.consent||[];
    return required.filter(function(i){ return have.indexOf(i)<0; });
  }
  function clientBlockers(clientId){
    var c=clientById(clientId); if(!c) return [];
    var out=healthBlockers(c.health).map(function(h){ return h.k+" — "+h.why; });
    if(c.age!=null && c.age<18) { if(!out.some(function(x){return x.indexOf("Under 18")===0;}))
      out.push("Under 18 — minors are not tattooed."); }
    if(!c.idOnFile) out.push("No photo ID on file — must be checked before the session starts.");
    return out;
  }
  function sessionReady(s){
    if(!s) return { ok:false, why:["No session"] };
    var why=clientBlockers(s.clientId).slice();
    var miss=consentMissing(s);
    if(miss.length && s.status!=="Complete") why.push("Consent incomplete: "+miss.join(", "));
    var a=artistById(s.artistId);
    if(a){ var cb=credBlockers(a); if(cb.length) why.push("Artist not clear to work: "+cb.join(" · ")); }
    return { ok: why.length===0, why:why };
  }
  /* Consent is taken at the door, so a future booking having none is NORMAL, not
     a problem. Flagging all of them would train the owner to ignore the number.
     Only sessions due today or already past are judged on consent; hard client
     blockers (no ID, a blocking health condition, a blocked artist) surface at
     any distance because they have to be solved before the day arrives. */
  function sessionsNotReady(wk){
    var today=iso(TODAY);
    return sessionsInWeek(wk||thisWeek())
      .filter(function(s){ return s.status==="Booked"; })
      .map(function(s){
        var hard = clientBlockers(s.clientId).slice();
        var a=artistById(s.artistId);
        if(a){ var cb=credBlockers(a); if(cb.length) hard.push("Artist not clear to work: "+cb.join(" \u00b7 ")); }
        var why = hard.slice();
        if(s.date <= today){
          var miss=consentMissing(s);
          if(miss.length) why.push("Consent incomplete: "+miss.join(", "));
        }
        return { session:s, check:{ ok: why.length===0, why:why },
                 dueToday: s.date <= today, hard: hard.length>0 };
      })
      .filter(function(x){ return !x.check.ok; });
  }
  function recordConsent(sessionId, items){
    return save(function(d){
      var s=d.sessions.filter(function(x){return x.id===sessionId;})[0]; if(!s) return;
      s.consent=items||[];
      logBus(d,"Front of house","Consent recorded for "+clientName(s.clientId)+".");
    });
  }

  /* ====================================================================
     ARTIST CREDENTIALS
     ==================================================================== */
  function credStatus(a,key){
    var meta=CREDS.filter(function(c){return c.k===key;})[0]||{};
    var v=(a.creds||{})[key];
    if(!v) return { state: meta.required?"missing":"n/a", days:null, value:null };
    if(v==="complete") return { state:"complete", days:null, value:"complete" };
    var dd=daysUntil(v);
    if(dd<0) return { state:"expired", days:dd, value:v };
    if(dd<=CRED_WARN_DAYS) return { state:"expiring", days:dd, value:v };
    return { state:"current", days:dd, value:v };
  }
  function credBlockers(a){
    var out=[];
    CREDS.forEach(function(c){ if(!c.required) return;
      var st=credStatus(a,c.k);
      if(st.state==="missing") out.push(c.k+" missing");
      else if(st.state==="expired") out.push(c.k+" EXPIRED"); });
    return out;
  }
  function credIssues(){
    var out=[];
    db().artists.forEach(function(a){ CREDS.forEach(function(c){
      var st=credStatus(a,c.k);
      if(st.state==="expired"||st.state==="expiring"||(st.state==="missing"&&c.required))
        out.push({artist:a, cred:c, status:st}); }); });
    var rank={expired:0,missing:1,expiring:2};
    return out.sort(function(x,y){ return (rank[x.status.state]-rank[y.status.state])||((x.status.days||0)-(y.status.days||0)); });
  }
  function cannotWork(){ return db().artists.filter(function(a){ return credBlockers(a).length>0; }); }

  /* ====================================================================
     FLASH — one-of-one inventory
     ==================================================================== */
  function flashAvailable(){ return db().flash.filter(function(f){ return f.status==="Available"; }); }
  function claimFlash(flashId, clientId){
    var f=flashById(flashId);
    if(!f) return { ok:false, why:"No such design." };
    if(f.status!=="Available") return { ok:false, why:"That design is already "+f.status.toLowerCase()+
      (f.claimedBy?(" by "+clientName(f.claimedBy)):"")+". Flash is tattooed once." };
    save(function(d){
      var x=d.flash.filter(function(y){return y.id===flashId;})[0];
      x.status="Claimed"; x.claimedBy=clientId||null;
      logBus(d,"Flash","“"+x.title+"” claimed"+(clientId?(" by "+clientName(clientId)):"")+" — retired from the wall.");
    });
    return { ok:true };
  }
  function releaseFlash(flashId){
    return save(function(d){
      var x=d.flash.filter(function(y){return y.id===flashId;})[0]; if(!x) return;
      x.status="Available"; x.claimedBy=null;
      logBus(d,"Flash","“"+x.title+"” released back to the wall.");
    });
  }
  function markTattooed(flashId){
    return save(function(d){
      var x=d.flash.filter(function(y){return y.id===flashId;})[0]; if(!x) return;
      x.status="Tattooed";
      logBus(d,"Flash","“"+x.title+"” tattooed.");
    });
  }

  /* ====================================================================
     THE MONEY — it splits at the chair
     ==================================================================== */
  function moneyFor(s){
    if(!s) return null;
    var a=artistById(s.artistId), price=Number(s.price)||0, hrs=Number(s.hours)||0;
    var supplies = hrs * RATES.suppliesPerHour;
    var cutPct = a ? (a.shopCut||0) : 0;
    var shopCut = price * cutPct;
    var artistNet = price - shopCut;
    /* The shop's own margin on the session: its cut, less the supplies it provides. */
    var shopNet = shopCut - supplies;
    return { price:price, hours:hrs, supplies:supplies, cutPct:cutPct,
             shopCut:shopCut, artistNet:artistNet, shopNet:shopNet,
             touchUp:!!s.touchUp,
             depositApplied:Number(s.depositApplied)||0,
             balanceDue: Math.max(0, price - (Number(s.depositApplied)||0)) };
  }
  function scoped(wk,scope){
    var rows=sessionsInWeek(wk||thisWeek());
    if(scope==="complete") return rows.filter(function(s){ return s.status==="Complete"; });
    if(scope==="paid") return rows.filter(function(s){ return s.status==="Complete" && !s.touchUp; });
    return rows;   // everything on the books
  }
  function weekRevenue(wk,s){ return scoped(wk,s).reduce(function(a,x){ var m=moneyFor(x); return a+(m?m.price:0); },0); }
  function weekShopCut(wk,s){ return scoped(wk,s).reduce(function(a,x){ var m=moneyFor(x); return a+(m?m.shopCut:0); },0); }
  function weekSupplies(wk,s){ return scoped(wk,s).reduce(function(a,x){ var m=moneyFor(x); return a+(m?m.supplies:0); },0); }
  function weekShopNet(wk,s){ return weekShopCut(wk,s) - weekSupplies(wk,s); }
  function weekHours(wk,s){ return scoped(wk,s).reduce(function(a,x){ return a+(x.hours||0); },0); }
  function chairHours(wk){ return weekHours(wk); }

  /* TOUCH-UPS — the tattoo equivalent of a warranty callback. Free to the
     client, real cost to the shop: a chair for an hour and a set of supplies. */
  function touchUps(wk){ return sessionsInWeek(wk||thisWeek()).filter(function(s){ return s.touchUp; }); }
  function touchUpCost(wk){
    return touchUps(wk).reduce(function(a,s){ var m=moneyFor(s); return a+(m?m.supplies:0); },0);
  }
  function touchUpHours(wk){ return touchUps(wk).reduce(function(a,s){ return a+(s.hours||0); },0); }
  function touchUpsByArtist(){
    var m={};
    db().sessions.filter(function(s){ return s.touchUp && s.artistId; })
      .forEach(function(s){ m[s.artistId]=(m[s.artistId]||0)+1; });
    return m;
  }
  function revenueByArtist(wk,s){
    var m={}; scoped(wk,s).forEach(function(x){ var q=moneyFor(x); if(!q) return;
      m[x.artistId]=(m[x.artistId]||0)+q.price; }); return m; }
  function revenueByStyle(wk,s){
    var m={};
    scoped(wk,s).forEach(function(x){
      var req=db().requests.filter(function(r){return r.clientId===x.clientId;})[0];
      var st=req?req.style:"Other"; var q=moneyFor(x); if(!q) return;
      m[st]=(m[st]||0)+q.price; });
    return m; }

  /* ====================================================================
     THE REQUEST PIPELINE
     ==================================================================== */
  function pipelineCounts(){ var m={}; STAGES.forEach(function(s){m[s]=0;});
    db().requests.forEach(function(r){ m[r.stage]=(m[r.stage]||0)+1; }); return m; }
  function openRequests(){ return db().requests.filter(function(r){
    return r.stage!=="Declined" && r.stage!=="Healed"; }); }
  function needsReview(){ return db().requests.filter(function(r){
    return r.stage==="New request"||r.stage==="Under review"; }); }
  function awaitingDeposit(){ return db().requests.filter(function(r){ return r.stage==="Deposit due"; }); }
  function pipelineValue(){
    return openRequests().reduce(function(a,r){ return a + (r.quote || r.budget || 0); },0); }
  function quoteWinRate(){
    var decided=db().requests.filter(function(r){
      return r.stage==="Declined" || stageIndex(r.stage)>=stageIndex("Booked"); });
    if(!decided.length) return null;
    var won=decided.filter(function(r){ return r.stage!=="Declined"; }).length;
    return (won/decided.length)*100; }
  function moveRequest(id,stage){
    return save(function(d){
      var r=d.requests.filter(function(x){return x.id===id;})[0]; if(!r) return;
      /* The gate: a request cannot reach Booked without its deposit. This is the
         single rule that stops a studio filling a calendar with no-shows. */
      if(stage==="Booked" && !depositSatisfied(r)){
        logBus(d,"Front of house","Blocked: "+clientName(r.clientId)+" cannot be booked until the deposit is taken.");
        r._blocked = "Deposit of "+money(depositDue(r.quote))+" has not been taken.";
        return;
      }
      delete r._blocked;
      r.stage=stage;
      logBus(d,"Front of house",clientName(r.clientId)+" → "+stage+".");
    });
  }
  function quoteRequest(id, amount){
    return save(function(d){
      var r=d.requests.filter(function(x){return x.id===id;})[0]; if(!r) return;
      r.quote=Number(amount)||0;
      if(r.quote){ r.stage = depositSatisfied(r) ? "Booked" : "Deposit due"; }
      logBus(d,"Front of house","Quoted "+clientName(r.clientId)+" at "+money(r.quote)+".");
    });
  }
  function addRequest(rec){
    var id="rq"+Date.now().toString(36);
    save(function(d){ d.requests.unshift(Object.assign({
      id:id, stage:"New request", received:iso(TODAY), quote:0, depositPaid:0,
      refs:0, sizeIn:0, budget:0, style:"American traditional", placement:"Outer forearm", desc:""
    }, rec||{}));
      logBus(d,"Front of house","New request received."); });
    return id;
  }
  function addSession(rec){
    var id="s"+Date.now().toString(36);
    save(function(d){ d.sessions.push(Object.assign({
      id:id, date:iso(TODAY), start:"13:00", hours:2, type:"Single sitting",
      price:0, depositApplied:0, consent:[], status:"Booked", note:"", touchUp:false
    }, rec||{}));
      logBus(d,"Booking","Session added for "+clientName(rec&&rec.clientId)+"."); });
    return id;
  }
  function completeSession(id){
    return save(function(d){
      var s=d.sessions.filter(function(x){return x.id===id;})[0]; if(!s) return;
      s.status="Complete";
      logBus(d,"Booking","Session complete — "+clientName(s.clientId)+".");
    });
  }
  function addClient(rec){
    var id="cl"+Date.now().toString(36);
    save(function(d){ d.clients.push(Object.assign({
      id:id, since:iso(TODAY), health:[], idOnFile:false, existing:"", note:"", age:null }, rec||{}));
      logBus(d,"Front of house","Client added."); });
    return id;
  }

  /* ====================================================================
     BUS + APPROVALS + KPIs
     ==================================================================== */
  function logBus(d,dept,msg){ d.bus=d.bus||[];
    d.bus.unshift({ts:new Date().toISOString().slice(0,19),dept:dept,msg:msg});
    if(d.bus.length>120) d.bus.length=120; }
  function bus(){ return db().bus||[]; }
  function approvals(){ return db().approvals||[]; }
  function decideApproval(id,dec){ return save(function(d){
    var a=d.approvals.filter(function(x){return x.id===id;})[0]; if(!a) return;
    a.stage = dec==="approve" ? "Approved":"Returned";
    logBus(d,a.dept,a.title+" — "+a.stage.toLowerCase()+"."); }); }

  function kpis(){
    var wk=thisWeek();
    var unp=unprotectedSessions(wk), nr=sessionsNotReady(wk), tu=touchUps(wk);
    return [
      { k:"On the books",     v:money(weekRevenue(wk)), n:sessionsInWeek(wk).length+" sessions this week", band:"good" },
      { k:"Shop's cut",       v:money(weekShopCut(wk)), n:"Booth rent across every chair" },
      { k:"Shop net",         v:money(weekShopNet(wk)), n:"After "+money(weekSupplies(wk))+" of supplies", band: weekShopNet(wk)>0?"good":"bad" },
      { k:"Chair hours",      v:chairHours(wk).toFixed(1), n:"Booked across "+db().artists.filter(function(a){return a.status==="Active";}).length+" active artists" },
      { k:"Unprotected slots",v:unp.length, n: unp.length? money(exposedValue(wk))+" booked with no deposit held":"Every slot is deposit-backed", band: unp.length?"bad":"good" },
      { k:"Not ready to run", v:nr.length, n: nr.length?"Consent, ID or artist credential missing":"Every booked session can proceed", band: nr.length?"bad":"good" },
      { k:"Needs a decision", v:needsReview().length, n:"Requests waiting on an artist to review" },
      { k:"Awaiting deposit", v:awaitingDeposit().length, n:"Quoted, not yet held" },
      { k:"Pipeline",         v:money(pipelineValue()), n:(quoteWinRate()==null?"—":pct(quoteWinRate()))+" of quotes convert" },
      { k:"Touch-ups",        v:tu.length, n: tu.length? money(touchUpCost(wk))+" of chair time and supplies, unbilled":"None this week", band: tu.length?"watch":"good" },
      { k:"Flash on the wall",v:flashAvailable().length, n:db().flash.length+" designs total · each tattooed once" },
      { k:"Artists blocked",  v:cannotWork().length, n: cannotWork().length? cannotWork().map(function(a){return a.name;}).join(", "):"Everyone is clear to work", band: cannotWork().length?"bad":"good" },
      { k:"Credentials due",  v:credIssues().length, n:"Expired, missing or inside "+CRED_WARN_DAYS+" days", band: credIssues().filter(function(i){return i.status.state==="expired";}).length?"bad":"watch" },
      { k:"Signatures out",   v:docsAwaiting().length, n:"Sent, not yet signed" }
    ];
  }

  /* ====================================================================
     NATIVE E-SIGN — the waiver signed on a phone at the door
     ==================================================================== */
  var ESIGN_CONSENT = "By selecting Adopt and Sign, I agree to do business electronically with {{SHOP}}, " +
    "I agree that my electronic signature is the legal equivalent of my handwritten signature, and I intend " +
    "to sign this record. I may request a paper copy at any time.";
  var DOC_TEMPLATES = [
    { id:"t_consent", title:"Consent, Health Screening & Waiver", who:"Client", body:[
      "IDENTITY AND AGE. I confirm I am at least 18 years of age and have presented valid photo identification. {{SHOP}} does not tattoo minors.",
      "HEALTH. I have disclosed all relevant medical conditions, including pregnancy, blood thinners, clotting disorders, diabetes, allergies and skin conditions. I understand some conditions require a physician's clearance before work begins.",
      "SOBRIETY. I am not under the influence of alcohol or drugs and am able to give informed consent today.",
      "PERMANENCE. I understand a tattoo is permanent, that removal is expensive, incomplete and painful, and that healed results vary with skin, placement and aftercare.",
      "AFTERCARE. I have received aftercare instructions and understand that failure to follow them is the most common cause of a poor healed result.",
      "TOUCH-UPS. A complimentary touch-up is available within {{TOUCHUP}} days of the session where the artist judges it warranted. Damage caused by poor aftercare, sun or picking is not covered.",
      "RELEASE. I release {{SHOP}} and the artist from liability for the ordinary consequences of being tattooed, having disclosed my health accurately."],
      fields:[{k:"sig",label:"Signature",type:"signature",required:true},
              {k:"name",label:"Printed name",type:"text",required:true},
              {k:"dob",label:"Date of birth",type:"date",required:true},
              {k:"date",label:"Today's date",type:"date",required:true},
              {k:"ackScope",label:"I confirm I am 18 or over and not under the influence today",type:"check",required:true},
              {k:"photo",label:"I allow photographs of the healed work for the shop's portfolio (optional)",type:"check",required:false}] },
    { id:"t_deposit", title:"Deposit Agreement", who:"Client", body:[
      "DEPOSIT. A deposit is required to hold a date. It is credited in full against the price of the work.",
      "NON-REFUNDABLE. The deposit pays for the artist's drawing time, which happens before you sit down. It is not refundable.",
      "RESCHEDULING. The deposit moves with you once, with at least 48 hours notice. A second reschedule, or less notice, forfeits it.",
      "NO-SHOW. Failing to attend forfeits the deposit and releases the slot.",
      "DESIGN. The artist will present the drawing at the appointment. Reasonable adjustments are expected; a complete change of concept may require a new quote."],
      fields:[{k:"sig",label:"Signature",type:"signature",required:true},
              {k:"name",label:"Printed name",type:"text",required:true},
              {k:"amount",label:"Deposit amount ($)",type:"text",required:true},
              {k:"date",label:"Date",type:"date",required:true},
              {k:"ackScope",label:"I understand the deposit is non-refundable and credits my final price",type:"check",required:true}] },
    { id:"t_booth", title:"Booth Rental Agreement", who:"Artist", body:[
      "INDEPENDENT ARTIST. The artist operates independently at {{SHOP}} and is responsible for their own taxes, insurance and licensing.",
      "SPLIT. The shop retains its agreed percentage of each session; the balance is the artist's. The split is applied at the point of sale.",
      "CREDENTIALS. The artist will keep bloodborne pathogen certification, first aid and artist licensing current, and understands they cannot be scheduled if any lapses.",
      "STATION AND STERILITY. The artist follows the shop's cross-contamination and sharps procedures without exception. Health-department findings are grounds for immediate termination.",
      "CLIENTS. Clients introduced by the shop remain the shop's clients."],
      fields:[{k:"sig",label:"Signature",type:"signature",required:true},
              {k:"name",label:"Printed name",type:"text",required:true},
              {k:"date",label:"Date",type:"date",required:true},
              {k:"ackScope",label:"I understand a lapsed credential removes me from the books",type:"check",required:true}] },
    { id:"t_aftercare", title:"Aftercare Acknowledgement", who:"Client", body:[
      "I have received written aftercare instructions and had the opportunity to ask questions.",
      "I understand that sun exposure, swimming, picking and scratching during healing are the most common causes of a poor result, and are not covered by the touch-up policy."],
      fields:[{k:"sig",label:"Signature",type:"signature",required:true},
              {k:"name",label:"Printed name",type:"text",required:true},
              {k:"date",label:"Date",type:"date",required:true}] }
  ];
  function templateById(id){ return DOC_TEMPLATES.filter(function(t){return t.id===id;})[0]||null; }
  function fillTemplate(s,ctx){ return String(s||"")
    .replace(/\{\{SHOP\}\}/g, ctx.shop||db().shop.name)
    .replace(/\{\{TOUCHUP\}\}/g, String(RATES.touchUpDays)); }
  function docContext(doc){ return { shop:db().shop.name }; }
  function newToken(){ var A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",p=function(n){var s="";for(var i=0;i<n;i++)s+=A[Math.floor(Math.random()*A.length)];return s;};
    return "SLV-"+p(4)+"-"+p(4); }
  function createDoc(tplId,subject,subjectId,signer){
    var tpl=templateById(tplId); if(!tpl) return null;
    var id="d"+Date.now().toString(36);
    save(function(d){ d.documents.unshift({ id:id,tpl:tplId,title:tpl.title,subject:subject,subjectId:subjectId||null,
      signer:signer||{name:"",email:"",role:""}, status:"Draft", created:iso(TODAY), sentTs:null,
      token:newToken(), values:{},
      audit:[{ts:new Date().toISOString().slice(0,19),who:d.shop.owner,what:"Document created from template"}] });
      logBus(d,"Paper","Drafted "+tpl.title+" for "+subject+"."); });
    return docById(id);
  }
  function sendDoc(id){ return save(function(d){
    var doc=d.documents.filter(function(x){return x.id===id;})[0]; if(!doc) return;
    if(!doc.token) doc.token=newToken();
    doc.status="Sent"; doc.sentTs=iso(TODAY);
    doc.audit.push({ts:new Date().toISOString().slice(0,19),who:d.shop.owner,what:"Signer link minted for "+(doc.signer.name||"the signer")}); }); }
  function openDoc(token){ save(function(d){
    var doc=d.documents.filter(function(x){return x.token===token;})[0]; if(!doc||doc.status==="Signed") return;
    doc.status="Viewed";
    doc.audit.push({ts:new Date().toISOString().slice(0,19),who:doc.signer.name||"Signer",what:"Opened the signing link"}); });
    return docByToken(token); }
  function signDoc(token,values,sig,meta){ meta=meta||{};
    return save(function(d){
      var doc=d.documents.filter(function(x){return x.token===token;})[0]; if(!doc||doc.status==="Signed") return;
      doc.values=values||{}; doc.signature=sig||null;
      doc.signedTs=new Date().toISOString().slice(0,19); doc.status="Signed";
      var who=(values&&values.name)||doc.signer.name||"Signer";
      doc.audit.push({ts:doc.signedTs,who:who,what:"Consented to do business electronically (ESIGN/UETA)"});
      doc.audit.push({ts:doc.signedTs,who:who,what:"Adopted and applied signature — record frozen"});
      if(meta.agent) doc.audit.push({ts:doc.signedTs,who:who,what:"Signed from: "+meta.agent});
      logBus(d,"Paper",doc.title+" signed by "+who+"."); }); }
  function docsAwaiting(){ return db().documents.filter(function(d){ return d.status==="Sent"||d.status==="Viewed"; }); }

  /* ====================================================================
     PRICE BOOK — ⚠ DRAFT. Spine ships in every tier.
     ==================================================================== */
  var ROOMS = {
    requests: { label:"Requests & Review",   mo:95,  build:700,
      why:"The structured intake that replaces the DM — references, placement, size, budget, and an artist decision." },
    booking:  { label:"Booking & Deposits",  mo:110, build:850,
      why:"The calendar, gated on the deposit. Nothing gets a slot until the drawing time is paid for." },
    flash:    { label:"Flash Wall",          mo:60,  build:450,
      why:"One-of-one design inventory that retires itself the moment it is claimed." },
    consent:  { label:"Consent & Health",    mo:75,  build:550,
      why:"Per-session screening, ID, waiver and aftercare — with the blocking conditions actually enforced." },
    artists:  { label:"Artists & Credentials",mo:65, build:500,
      why:"The roster, booth splits, and the bloodborne card that a health inspector will ask for." },
    money:    { label:"Money & Booth Rent",  mo:100, build:800,
      why:"Every session split at the chair, deposits credited, and the touch-up cost nobody measures." },
    books:    { label:"Books & Metrics",     mo:75,  build:550,
      why:"Revenue by artist and by style, quote conversion, deposit exposure, touch-up rate." },
    portal:   { label:"Client Portal",       mo:65,  build:500,
      why:"Where the client sees their quote, their deposit, their date and their aftercare." },
    sign:     { label:"e-Sign",              mo:65,  build:500,
      why:"Waivers, deposit agreements and booth contracts signed in any browser, with an audit trail." },
    org:      { label:"Agent Org · Bus",     mo:130, build:1000,
      why:"The AI department chains, the event bus and the confidence gates." }
  };
  var TIERS = {
    chair: { key:"chair", name:"Chair", rank:1, mo:250, build:2400,
      desc:"A single artist. The whole system, sized for someone who is both the artist and the front desk.",
      base:"1 artist · the full spine",
      includes:["requests","booking","flash","consent","artists","money","portal","sign"] },
    studio: { key:"studio", name:"Studio", rank:2, mo:650, build:5600,
      desc:"A real shop with a front desk and booth renters. Adds books & metrics and the AI department org.",
      base:"Unlimited artists · booth-rent accounting · agent org",
      includes:["requests","booking","flash","consent","artists","money","books","portal","sign","org"] },
    grandsuite: { key:"grandsuite", name:"Grandsuite", rank:3, mo:1400, build:11000,
      desc:"Nothing held back. Multi-location, guest-artist scheduling, dedicated environment, migration and your own branded booking site.",
      base:"Multi-location · guest artists · dedicated environment · migration · branded site",
      includes:["requests","booking","flash","consent","artists","money","books","portal","sign","org"] }
  };
  var DEPTS = [
    { group:"Command", items:[
      { href:"dashboard.html", label:"Command Center", ic:"◎" },
      { href:"calendar.html",  label:"Calendar",       ic:"▤" },
      { href:"contacts.html",  label:"Contacts",       ic:"☎" },
      { href:"connect.html",   label:"Connect · Video",ic:"◉" },
      { href:"records.html",   label:"Records · Filing",ic:"▤" },
      { href:"approvals.html", label:"Approval Desk",  ic:"✓", accent:"ops" } ]},
    { group:"The Queue", items:[
      { href:"requests.html",  label:"Requests & Review",ic:"✦", room:"requests", accent:"requests" },
      { href:"booking.html",   label:"Booking & Deposits",ic:"▦", room:"booking", accent:"book" },
      { href:"flash.html",     label:"Flash Wall",      ic:"◈", room:"flash",    accent:"flash" } ]},
    { group:"The Chair", items:[
      { href:"consent.html",   label:"Consent & Health",ic:"⛨", room:"consent",  accent:"consent" },
      { href:"artists.html",   label:"Artists",         ic:"★", room:"artists",  accent:"artists" },
      { href:"portal.html",    label:"Client Portal",   ic:"☗", room:"portal",   accent:"portal" } ]},
    { group:"Paper", items:[
      { href:"sign.html",      label:"e-Sign",          ic:"✍", room:"sign",     accent:"sign" } ]},
    { group:"Money", items:[
      { href:"money.html",     label:"Money & Booth Rent",ic:"◧", room:"money",  accent:"money" },
      { href:"books.html",     label:"Books & Metrics", ic:"◭", room:"books",    accent:"money" } ]},
    { group:"The Org", items:[
      { href:"org.html",       label:"Agent Org · Bus", ic:"❖", room:"org",      accent:"ops" } ]}
  ];
  function tier(){ return db().tier||"grandsuite"; }
  function setTier(k){ return save(function(d){ d.tier=k; d.adds=[]; d.offs=[]; }); }
  function activeRooms(){ var d=db(), t=TIERS[d.tier]||TIERS.grandsuite, set=t.includes.slice();
    (d.adds||[]).forEach(function(k){ if(set.indexOf(k)<0) set.push(k); });
    (d.offs||[]).forEach(function(k){ set=set.filter(function(x){return x!==k;}); });
    return set; }
  function hasRoom(k){ return activeRooms().indexOf(k)>=0; }
  function toggleRoom(k){ return save(function(d){
    var t=TIERS[d.tier]||TIERS.grandsuite, inPack=t.includes.indexOf(k)>=0, on=activeRooms().indexOf(k)>=0;
    d.adds=d.adds||[]; d.offs=d.offs||[];
    if(on){ if(inPack) d.offs.push(k); else d.adds=d.adds.filter(function(x){return x!==k;}); }
    else  { if(inPack) d.offs=d.offs.filter(function(x){return x!==k;}); else d.adds.push(k); } }); }
  function priceNow(){ var d=db(), t=TIERS[d.tier]||TIERS.grandsuite, adds=d.adds||[], offs=d.offs||[];
    var am=adds.reduce(function(a,k){return a+((ROOMS[k]||{}).mo||0);},0);
    var ab=adds.reduce(function(a,k){return a+((ROOMS[k]||{}).build||0);},0);
    var om=offs.reduce(function(a,k){return a+((ROOMS[k]||{}).mo||0);},0);
    var ob=offs.reduce(function(a,k){return a+((ROOMS[k]||{}).build||0);},0);
    var rooms=activeRooms(), ala=rooms.reduce(function(a,k){return a+((ROOMS[k]||{}).mo||0);},0);
    var mo=Math.max(0,t.mo+am-om);
    return { tier:t, adds:adds, offs:offs, mo:mo, build:Math.max(0,t.build+ab-ob), rooms:rooms,
             alaMo:ala, savingMo:Math.max(0,ala-mo), changed:adds.length>0||offs.length>0 }; }
  function priceLabel(){ var p=priceNow(); return money(p.mo)+"/mo · "+money(p.build)+" build"; }

  var SEATS = [
    { dept:"Front of house", dh:"Nyx",  ae:"Robin", focus:"Request response time, quote conversion, and whether every slot is deposit-backed." },
    { dept:"The Chair",      dh:"Vale", ae:"June",  focus:"Consent completeness, ID on file, artist credentials, and sessions that cannot legally run." },
    { dept:"Money",          dh:"Cass", ae:"Ora",   focus:"Booth splits, shop net after supplies, deposit exposure and touch-up cost." },
    { dept:"The Wall",       dh:"Bly",  ae:"Fen",   focus:"Flash inventory, what is moving, and what has been on the wall too long." },
    { dept:"Compliance",     dh:"Sorel",ae:"Wick",  focus:"Bloodborne certification, health-department readiness, sharps and cross-contamination records." }
  ];
  var BRAIN = { name:"Raven", role:"COO — the single point of contact",
    line:"Every department's conclusion reaches the owner through one seat, packaged as one decision at a time." };

  /* ------------------------------------------------------------- UI helpers */
  function el(h){ var t=document.createElement("template"); t.innerHTML=String(h).trim(); return t.content.firstChild; }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function money(n){ return "$"+(Math.round(Number(n)||0)).toLocaleString(); }
  function money2(n){ return "$"+(Number(n)||0).toFixed(2); }
  function pct(n,dp){ return (Number(n)||0).toFixed(dp===undefined?0:dp)+"%"; }
  function hhmm(s){ var p=String(s||"").split(":"); if(p.length<2) return s||"";
    var h=+p[0],m=p[1],ap=h>=12?"p":"a"; h=h%12; if(!h) h=12; return h+(m==="00"?"":":"+m)+ap; }
  function dayLabel(dISO){ var d=new Date(dISO+"T12:00:00");
    return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]+" "+(d.getMonth()+1)+"/"+d.getDate(); }
  var MARK_URL="https://www.aexperiences.com/Sleeves_OS.png";
  function brandMark(){ return '<img src="'+MARK_URL+'" alt="Sleeves OS" width="34" height="34" '+
    'style="display:block;border-radius:9px" onerror="this.style.display=\'none\';this.parentNode.textContent=\'SL\';">'; }
  function stageBand(s){ return s==="Declined"?"bad": s==="Booked"||s==="Healed"?"good":
    s==="Deposit due"?"watch":""; }

  /* ------------------------------------------------------------- the shell */
  function renderShell(active){
    var side=document.createElement("aside"); side.className="sidebar";
    side.appendChild(el('<a href="dashboard.html" class="brand"><div class="bmark">'+brandMark()+
      '</div><div><div class="bt">Sleeves OS</div><div class="bs">Tattoo Studio OS</div></div></a>'));
    var nav=document.createElement("nav"); nav.className="nav"; var on=activeRooms();
    DEPTS.forEach(function(g){
      nav.appendChild(el('<div class="nav-group">'+esc(g.group)+'</div>'));
      g.items.forEach(function(it){
        var off=it.room && on.indexOf(it.room)<0;
        var a=el('<a href="'+(off?"javascript:void(0)":it.href)+'" class="navlink '+(it.href===active?"active":"")+
          (off?" locked":"")+'"'+(it.accent?' data-accent="'+it.accent+'"':"")+'><span class="ic">'+it.ic+
          '</span><span class="lb">'+esc(it.label)+'</span>'+(off?'<span class="tier-tag">+'+money(ROOMS[it.room].mo)+'</span>':'')+'</a>');
        if(off){ a.title="Not in this build — add "+ROOMS[it.room].label+" for "+money(ROOMS[it.room].mo)+"/mo";
          a.addEventListener("click",function(){ toggleRoom(it.room);
            toast(ROOMS[it.room].label+" added — "+priceLabel(),"ok");
            setTimeout(function(){location.reload();},500); }); }
        nav.appendChild(a); }); });
    side.appendChild(nav); return side;
  }
  var MOBILE_NAV=[{href:"dashboard.html",label:"Home",ic:"◎"},
    {href:"requests.html",label:"Queue",ic:"✦",room:"requests"},
    {href:"booking.html",label:"Book",ic:"▦",room:"booking"},
    {href:"money.html",label:"Money",ic:"◧",room:"money"},
    {href:"approvals.html",label:"Approvals",ic:"✓"}];
  function renderMobileBar(active){
    var bar=document.createElement("nav"); bar.className="mobilebar"; var on=activeRooms();
    MOBILE_NAV.forEach(function(it){ var off=it.room&&on.indexOf(it.room)<0;
      bar.appendChild(el('<a href="'+(off?"javascript:void(0)":it.href)+'" class="mb-link '+(it.href===active?"active":"")+
        '"><span class="mb-ic">'+it.ic+'</span><span class="mb-lb">'+esc(it.label)+'</span></a>')); });
    bar.appendChild(el('<button class="mb-link mb-menu" id="mbMenu"><span class="mb-ic">☰</span><span class="mb-lb">Menu</span></button>'));
    return bar; }
  function renderTopbar(crumb){
    var p=priceNow(), s=db().shop;
    var bar=document.createElement("div"); bar.className="topbar";
    var ini=(s.owner||"MH").split(" ").map(function(w){return w[0];}).join("").slice(0,2).toUpperCase();
    bar.innerHTML='<button class="hamburger" id="hamburger" aria-label="Open menu">☰</button>'+
      '<div class="crumbs">Sleeves OS · <b>'+esc(crumb)+'</b></div><div class="spacer"></div>'+
      '<div class="tierpill" id="tierPillStatic"><span class="dot"></span><div><b>'+esc(p.tier.name)+
      (p.changed?' <i class="cfg">configured</i>':'')+'</b> <span class="price">'+money(p.mo)+'/mo · '+money(p.build)+
      ' build</span></div></div><div class="who"><div class="av">'+esc(ini)+'</div><div>'+esc(s.owner)+
      '<br><span class="muted small">Owner · '+esc(s.name)+'</span></div></div>';
    return bar; }
  function ribbon(){ return el('<div class="ribbon"><span class="live">LIVE SHOWROOM</span>'+
    ' — this is the real operating system, not a slideshow. Type anywhere; it saves in your browser. '+
    'The studio, artists and clients below are a realistic sample book. '+
    '<a href="javascript:void(0)" id="resetFloor">Start with a clean slate</a></div>'); }
  function footer(){ return el('<div class="ae-credit">Powered by <b>Accelerated Experiences LLC</b> · Sleeves OS is a '+
    'white-label build. Sample data is a fictional studio. Benchmarks are sourced or shown blank — never invented. '+
    'Nothing here is legal, medical or licensing advice.</div>'); }
  function toast(m,k){ var w=document.getElementById("toast-wrap"); if(!w) return;
    var t=el('<div class="toast '+(k||"")+'">'+esc(m)+'</div>'); w.appendChild(t);
    setTimeout(function(){ t.style.opacity="0"; setTimeout(function(){t.remove();},250); },2600); }
  /* The fleet-wide Command Center polish layer. One file on the store, loaded by
     every product, so a change lands everywhere at once instead of fourteen times. */
  function loadFlava(){
    if(document.getElementById("aeFlavaCss")) return;
    var l=document.createElement("link"); l.id="aeFlavaCss"; l.rel="stylesheet";
    l.href="https://www.aexperiences.com/ae-flava.css"; document.head.appendChild(l);
    var j=document.createElement("script"); j.src="https://www.aexperiences.com/ae-flava.js";
    j.defer=true; document.head.appendChild(j);
  }
  function mount(o){
    try{ loadFlava(); }catch(e){} o=o||{}; db();
    var app=document.createElement("div"); app.className="app";
    var side=renderShell(o.active), backdrop=el('<div class="nav-backdrop" id="navBackdrop"></div>');
    var main=document.createElement("div"); main.className="main";
    main.appendChild(ribbon()); main.appendChild(renderTopbar(o.crumb||"Command Center"));
    var content=document.createElement("div"); content.className="content"; content.id="content";
    main.appendChild(content); main.appendChild(footer());
    app.appendChild(side); app.appendChild(main);
    document.body.innerHTML=""; document.body.appendChild(app); document.body.appendChild(backdrop);
    document.body.appendChild(renderMobileBar(o.active));
    document.body.appendChild(el('<div id="toast-wrap"></div>'));
    setTimeout(function(){
      var r=document.getElementById("resetFloor");
      if(r) r.addEventListener("click",function(){
        if(!confirm("Clear the sample studio and start with an empty book?\n\nThis removes the sample artists, clients, requests and flash so you can enter your own. It cannot be undone.")) return;
        goLive(); toast("Empty book ready. Add your first artist.","ok");
        setTimeout(function(){location.reload();},500); });
      function open(){ side.classList.add("open"); backdrop.classList.add("show"); }
      function close(){ side.classList.remove("open"); backdrop.classList.remove("show"); }
      var h=document.getElementById("hamburger"), m=document.getElementById("mbMenu");
      if(h) h.addEventListener("click",open); if(m) m.addEventListener("click",open);
      backdrop.addEventListener("click",close);
      Array.prototype.forEach.call(side.querySelectorAll("a.navlink"),function(a){ a.addEventListener("click",close); });
    },0);
    return content; }
  function page(t,s,a){ return el('<div class="pagehead"><div><h1>'+esc(t)+'</h1>'+
    (s?'<p class="sub">'+s+'</p>':"")+'</div><div class="pagehead-actions">'+(a||"")+'</div></div>'); }
  function card(i,c){ return el('<section class="card '+(c||"")+'">'+i+'</section>'); }
  function stat(l,v,n,b){ return '<div class="stat '+(b||"")+'"><div class="s-l">'+esc(l)+'</div><div class="s-v">'+v+
    '</div>'+(n?'<div class="s-n">'+n+'</div>':"")+'</div>'; }
  function tag(t,k){ return '<span class="tag '+(k||"")+'">'+esc(t)+'</span>'; }
  function srcNote(t){ return '<div class="srcnote">Source: '+esc(t)+'</div>'; }
  function bar(p,c){ var w=Math.max(0,Math.min(100,p));
    return '<div class="bar" style="margin-top:6px"><i style="width:'+w.toFixed(0)+'%'+(c?";background:"+c:"")+'"></i></div>'; }

  /* ------------------------------------------------------- owner's manual */
  var MANUAL = [
    { t:"What this system is", c:"Sleeves OS runs a tattoo studio end to end: the request queue, the quote, the deposit, the calendar, consent, the session, the split and the follow-up. Every number on a dashboard is computed from your own book." },
    { t:"Start with a clean slate", c:"It opens on a realistic sample studio so you can see how every room behaves with data in it. When you are ready for your own book, use 'Start with a clean slate' in the ribbon." },
    { t:"Why this is not a booking app", c:"A haircut is a booking: pick a time, show up. A tattoo is not. The artist has to see references, judge whether it is in their style, whether it is physically possible, and how long it will take — before a time can exist. Sleeves OS starts four steps earlier than a calendar: request, review, quote, deposit, and only then a slot." },
    { t:"The deposit is the whole model", c:"The artist draws for hours before anyone sits down. A no-show with no deposit held is half a day of income gone and a chair that could have been sold. The system will not let a request reach Booked until the deposit is taken, and the deposit credits the final price — it is not an extra fee." },
    { t:"Unprotected slots", c:"The Command Center counts sessions sitting on the calendar with no deposit behind them, and totals what they are worth. That number is your exposure for the week. Most studios discover it one morning at a time." },
    { t:"Flash is tattooed once", c:"A flash design is a one-off. The moment someone claims it, it retires from the wall — you cannot promise the same drawing to two people. Trying to claim a design that is already gone tells you who has it." },
    { t:"Consent is per session, not per client", c:"Health facts change, and the waiver has to name the work being done that day. Every session needs ID checked, a health screening, a signed waiver and aftercare given. The system lists exactly what is missing before the artist starts." },
    { t:"The conditions that stop a session", c:"Under 18, pregnancy, being under the influence today, and clotting disorders are hard stops — not paperwork to be waived. Blood thinners, diabetes, keloid history, latex allergy and a few others are not stops, but they change how the session runs, and the system says how." },
    { t:"Job-stoppers", c:"Hands, necks and faces are flagged when someone requests them. That is not squeamishness — it is the conversation that prevents a regretted tattoo, a bad review, and a cover-up you will be asked to do for free." },
    { t:"How the money splits at the chair", c:"Most artists rent a booth: the shop keeps a percentage of each session and the artist keeps the rest. The split is applied on every session, and the shop's own net is its cut minus the supplies it provides. Owner-artists show a zero split, which is correct — they are the shop." },
    { t:"Touch-ups cost real money", c:"A free touch-up is a chair for an hour and a full set of supplies, billed to nobody. It is the tattoo equivalent of a warranty callback. The system costs it every week and counts it by artist — not to punish anyone, but because a pattern usually means technique or aftercare instruction, and you cannot see either without the number." },
    { t:"Artist credentials", c:"Bloodborne pathogen certification, first aid and artist licensing are tracked with real dates. A lapsed bloodborne card is a health-department inspectable item, so an expired one removes that artist from the books until it is renewed." },
    { t:"e-Sign at the door", c:"The waiver, the deposit agreement and the booth contract are signed on a phone in any browser — no account, no app. The signer consents to sign electronically, adopts a signature, and the record freezes with a timestamped audit trail." },
    { t:"Is an electronic waiver legally binding?", c:"US law (ESIGN and UETA) generally makes an electronic signature as enforceable as ink when the signer consented to do business electronically, intended to sign, the signature is attributable to them, and the record is retained. This module captures all four. It is not legal advice — have your attorney review the waiver language for your state, because tattoo consent is state-regulated." },
    { t:"What this system does NOT do by itself", c:"Three things need an outside party and the system says so: taking the deposit (a licensed payment processor moves the money), posting to Instagram (Meta's own API), and filing with the health department (the county holds the record). Everything upstream of those is native here." },
    { t:"On your phone", c:"Every room works on a phone. The bottom bar carries Home, Queue, Book, Money and Approvals; Menu opens everything else." }
  ];
  function manual(){ return MANUAL; }
  function askManual(q){
    q=String(q||"").toLowerCase().trim(); if(!q) return [];
    var syn={dm:"request",instagram:"request",dep:"deposit",noshow:"deposit",waiver:"consent",
      minor:"18",kid:"18",split:"chair",booth:"chair",rent:"chair",touchup:"touch-up",
      esign:"signature","e-sign":"signature",hand:"job-stopper",neck:"job-stopper"};
    var terms=q.split(/[^a-z0-9-]+/).filter(Boolean).map(function(w){ return syn[w]||w; });
    return MANUAL.map(function(a){ var hay=(a.t+" "+a.c).toLowerCase(), s=0;
      terms.forEach(function(t){ if(!t||t.length<3) return;
        if(a.t.toLowerCase().indexOf(t)>=0) s+=6; s+=hay.split(t).length-1; });
      return {a:a,s:s}; }).filter(function(r){return r.s>0;})
      .sort(function(x,y){return y.s-x.s;}).slice(0,4).map(function(r){return r.a;});
  }

  document.addEventListener("visibilitychange",function(){ if(!document.hidden) db(); });

  global.Sleeves = {
    db:db, save:save, fresh:fresh, goLive:goLive, isSample:isSample, SEED:SEED, TODAY:TODAY,
    iso:iso, addDays:addDays, weekOf:weekOf, thisWeek:thisWeek, lastWeek:lastWeek,
    sessionsInWeek:sessionsInWeek, daysUntil:daysUntil,
    STYLES:STYLES, styleColor:styleColor, PLACEMENTS:PLACEMENTS, PLACEMENT_FLAGS:PLACEMENT_FLAGS,
    SESSION_TYPES:SESSION_TYPES, STAGES:STAGES, stageIndex:stageIndex, stageBand:stageBand,
    HEALTH:HEALTH, healthBlockers:healthBlockers, CONSENT_ITEMS:CONSENT_ITEMS,
    CREDS:CREDS, CRED_WARN_DAYS:CRED_WARN_DAYS, RATES:RATES, BENCH:BENCH, REPLACES:REPLACES,
    DOC_TEMPLATES:DOC_TEMPLATES, ESIGN_CONSENT:ESIGN_CONSENT, templateById:templateById,
    clientById:clientById, artistById:artistById, requestById:requestById, sessionById:sessionById,
    flashById:flashById, docById:docById, docByToken:docByToken, artistName:artistName, clientName:clientName,
    depositDue:depositDue, depositHeld:depositHeld, depositSatisfied:depositSatisfied,
    unprotectedSessions:unprotectedSessions, exposedValue:exposedValue, takeDeposit:takeDeposit,
    consentMissing:consentMissing, clientBlockers:clientBlockers, sessionReady:sessionReady,
    sessionsNotReady:sessionsNotReady, recordConsent:recordConsent,
    credStatus:credStatus, credBlockers:credBlockers, credIssues:credIssues, cannotWork:cannotWork,
    flashAvailable:flashAvailable, claimFlash:claimFlash, releaseFlash:releaseFlash, markTattooed:markTattooed,
    moneyFor:moneyFor, scoped:scoped, weekRevenue:weekRevenue, weekShopCut:weekShopCut,
    weekSupplies:weekSupplies, weekShopNet:weekShopNet, weekHours:weekHours, chairHours:chairHours,
    touchUps:touchUps, touchUpCost:touchUpCost, touchUpHours:touchUpHours, touchUpsByArtist:touchUpsByArtist,
    revenueByArtist:revenueByArtist, revenueByStyle:revenueByStyle,
    pipelineCounts:pipelineCounts, openRequests:openRequests, needsReview:needsReview,
    awaitingDeposit:awaitingDeposit, pipelineValue:pipelineValue, quoteWinRate:quoteWinRate,
    moveRequest:moveRequest, quoteRequest:quoteRequest, addRequest:addRequest,
    addSession:addSession, completeSession:completeSession, addClient:addClient,
    createDoc:createDoc, sendDoc:sendDoc, openDoc:openDoc, signDoc:signDoc, docsAwaiting:docsAwaiting,
    fillTemplate:fillTemplate, docContext:docContext,
    SEATS:SEATS, BRAIN:BRAIN, bus:bus, approvals:approvals, decideApproval:decideApproval,
    TIERS:TIERS, ROOMS:ROOMS, DEPTS:DEPTS, tier:tier, setTier:setTier, activeRooms:activeRooms,
    hasRoom:hasRoom, toggleRoom:toggleRoom, priceNow:priceNow, priceLabel:priceLabel,
    manual:manual, askManual:askManual, kpis:kpis,
    mount:mount, toast:toast, el:el, esc:esc, money:money, money2:money2, pct:pct,
    hhmm:hhmm, dayLabel:dayLabel, page:page, card:card, stat:stat, tag:tag, srcNote:srcNote, bar:bar,
    brandMark:brandMark, MARK_URL:MARK_URL
  };
})(window);
