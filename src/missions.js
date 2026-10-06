// Missions reuse the office's required links (see engine.js) by index:
// 0 ISP→modem fiber · 1 modem→router WAN · 2 router LAN→switch · 3 switch→AP · 4 switch→PC
// 5 switch→phone · 6 switch→camera · 7 switch→printer · 8 AP→laptop Wi-Fi
// 9 UPS→modem · 10 UPS→router · 11 UPS→switch · 12 UPS→PC · 13 UPS→printer
// `start` links are already plugged in, `add` links are the player's job, and `faults` are
// wrong cables already in the scene that must be unplugged.
const ALL=[...Array(14).keys()];
const CLOSET=[0,1,2,9,10,11];
const except=(...skip)=>ALL.filter(i=>!skip.includes(i));
const fault=(a,ap,b,bp,cable,why)=>({a,ap,b,bp,cable,why});
const mission=(id,track,title,brief,start,add,faults=[])=>({id,track,title,brief,start,add,faults});
export const tracks=['Installs','Builds','Outages','Troubleshooting'];
export const missions=[
mission('fiber','Installs','Light up the fiber','The ISP just installed fiber. Connect the modem/ONT to the optical handoff and give it backup power.',[],[0,9]),
mission('edge','Installs','Router on the edge','The modem has signal. Put the router behind it and power it from the UPS.',[0,9],[1,10]),
mission('core','Installs','Core switch install','Rack the PoE switch: feed it from the router LAN and give it UPS power.',[0,1,9,10],[2,11]),
mission('workstation','Installs','First workstation','A new hire starts today. Get their desktop PC on the wired network with backup power.',CLOSET,[4,12]),
mission('printer','Installs','Network printer setup','Finance needs to print invoices. Wire the network printer and power it.',CLOSET,[7,13]),
mission('voip','Installs','VoIP phone rollout','Replace the old analog line: connect the VoIP phone. PoE powers it, so no power cable is needed.',CLOSET,[5]),
mission('camera','Installs','Security camera install','Facilities wants the entrance covered. Connect the PoE IP camera.',CLOSET,[6]),
mission('wireless','Installs','Wireless coverage','Visitors need Wi-Fi. Mount the access point and uplink it to the PoE switch.',CLOSET,[3]),
mission('laptop','Installs','Laptop onboarding','The access point is live. Join the manager\'s laptop to the office Wi-Fi.',[...CLOSET,3],[8]),
mission('poe','Installs','PoE rollout','Bring up every PoE device at once: access point, VoIP phone, and IP camera.',CLOSET,[3,5,6]),
mission('closet','Builds','Build the comms closet','An empty rack. Build the internet uplink (ISP, modem, router, switch) and put all of it on the UPS.',[],CLOSET),
mission('desks','Builds','Wired desks','Wireless and PoE are done. Finish the wired desks: desktop and printer, with UPS power.',[...CLOSET,3,5,6,8],[4,7,12,13]),
mission('endpoints','Builds','Furnish the office','The closet is ready. Connect every endpoint in the office and get it online.',CLOSET,[3,4,5,6,7,8,12,13]),
mission('power','Builds','Backup power drill','All the data cables are in, but nothing is on the UPS. Power every mains device.',[0,1,2,3,4,5,6,7,8],[9,10,11,12,13]),
mission('office','Builds','Connect the whole office','The original challenge: wire the entire office from scratch.',[],ALL),
mission('dark','Outages','Half the office went dark','After the cleaners came through, most of the office dropped offline. Find what was unplugged.',except(11),[11]),
mission('morning','Outages','Monday morning outage','Nobody can reach the internet, yet the modem has signal. Work inward and find the missing link.',except(10),[10]),
mission('print-down','Outages','Printer offline','The printer shows offline on everyone\'s screen. Get it back.',except(13),[13]),
mission('no-wifi','Outages','No Wi-Fi anywhere','The laptop can\'t see the office network. Restore wireless.',except(3,8),[3,8]),
mission('isp-down','Outages','Internet is down','After a power cut nothing reaches the internet. Restore the uplink from the ISP inward.',except(0,9),[0,9]),
mission('chaos','Outages','Cleaning crew chaos','Several cables were knocked out overnight. Find and reconnect all of them.',except(2,6,12),[2,6,12]),
mission('wrong-side','Troubleshooting','Wrong side of the router','Nobody has internet. The modem seems to be plugged into the wrong router port.',except(1),[1],[fault('modem','eth','router','lan','ethernet','The modem must connect to the router WAN port. LAN faces the office.')]),
mission('backwards','Troubleshooting','Backwards uplink','A contractor rewired the router and now the office is offline. Fix the WAN and LAN cabling.',except(1,2),[1,2],[fault('switch','eth','router','wan','ethernet','The switch belongs on a router LAN port. WAN is for the modem.')]),
mission('dark-camera','Troubleshooting','The camera is dark','The new camera never powers on. Check what it is plugged into.',except(6),[6],[fault('camera','eth','router','lan','ethernet','The router LAN port does not supply PoE. The camera must connect to the PoE switch.')]),
mission('phone-cord','Troubleshooting','Phone cord mix-up','The VoIP phone has no dial tone. Someone used the wrong kind of cable.',except(5),[5],[fault('switch','eth','phone','eth','phone','An RJ11 phone cord can\'t carry Ethernet or PoE. Use a Cat6 cable.')]),
mission('bypass','Troubleshooting','Desktop bypassing the firewall','Security flagged the desktop talking straight to the internet. Move it behind the router.',except(4),[4],[fault('pc','eth','modem','eth','ethernet','Plugging a PC into the modem skips the router and its firewall.')]),
mission('ap-misplaced','Troubleshooting','Access point in the wrong place','The access point lights never come on, so the laptop can\'t connect.',except(3),[3],[fault('ap','eth','router','lan','ethernet','The access point needs PoE from the switch. The router LAN port has no power.')]),
mission('printer-cord','Troubleshooting','Printer cable swap','The printer has power but no network. Inspect its cable.',except(7),[7],[fault('printer','eth','switch','eth','phone','RJ11 phone cords fit loosely in Ethernet ports but carry no network traffic.')]),
mission('double','Troubleshooting','Double trouble','Two tickets came in at once: no internet, and the camera is dark. Fix both.',except(1,6),[1,6],[fault('modem','eth','router','lan','ethernet','The modem must connect to the router WAN port.'),fault('camera','eth','router','lan','ethernet','The camera needs PoE from the switch.')]),
mission('final','Troubleshooting','Final exam: the messy office','You inherited a badly wired office. Remove every bad cable and rebuild it properly.',[0,8,9,10,12,13],[1,2,3,4,5,6,7,11],[fault('modem','eth','router','lan','ethernet','The modem must connect to the router WAN port.'),fault('ap','eth','router','lan','ethernet','The access point needs PoE from the switch.'),fault('pc','eth','modem','eth','ethernet','The desktop must sit behind the router, not on the modem.')]),
];
