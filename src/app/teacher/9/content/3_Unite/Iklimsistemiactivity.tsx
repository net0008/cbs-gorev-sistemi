"use client";
import { useState } from "react";

function beep(f: number, d: number, t: OscillatorType = "sine", v = 0.15) {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = f; o.type = t;
    g.gain.setValueAtTime(v, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d);
    o.start(); o.stop(ctx.currentTime + d);
    setTimeout(() => ctx.close(), d * 1000 + 200);
  } catch (_) {}
}
const sndOK    = () => [440,554,660].forEach((f,i)=>setTimeout(()=>beep(f,0.22,"sine",0.13),i*80));
const sndFail  = () => beep(200,0.30,"sawtooth",0.12);
const sndClick = () => beep(680,0.07,"square",0.06);
const sndDrop  = () => beep(520,0.12,"sine",0.10);

const FONT = "'Segoe UI','Helvetica Neue',Arial,sans-serif";
const MONO = "'Courier New',Courier,monospace";
const BG   = "#060c18";
const C    = "#0ea5e9";
const C2   = "#f97316";
const C3   = "#a78bfa";
const C4   = "#34d399";
const C5   = "#f59e0b";
const PANEL= "rgba(6,12,24,0.85)";
type Tab = "learn"|"act"|"test";
type LearnSec = "bilesenleri"|"atmosfer_katmanlari"|"sicaklik"|"basinc"|"ruzgarlar"|"yagis";

interface Bilesen { id:string; no:number; ad:string; latince:string; icon:string; color:string; tanim:string; ozellikler:string[]; }
const BILESENLERI: Bilesen[] = [
  { id:"hidrosfer", no:1, ad:"Hidrosfer", latince:"Su Küre", icon:"🌊", color:"#0369a1",
    tanim:"Yeryüzündeki okyanus, deniz, göl ve akarsu sularından oluşur. Güneşten aldığı enerjiyi diğer bileşenlere göre daha fazla depolayabilir.",
    ozellikler:["Güneş enerjisini diğer bileşenlerden fazla depolar","Enerjiyi atmosfere yavaş yavaş vererek sıcaklık dengesini sağlar","Buharlaşma yoluyla atmosfere su buharı sağlar","Okyanus akıntılarıyla Ekvator-kutup arasında enerji taşır"] },
  { id:"litosfer",  no:2, ad:"Litosfer",  latince:"Taş Küre", icon:"⛰️", color:"#78350f",
    tanim:"Taş küre olarak da bilinen litosfer, yeryüzündeki kayaç ve toprakları kapsar. İklim sistemi üzerindeki etkisi uzun zamanda gerçekleşir.",
    ozellikler:["Levha hareketleri milyonlarca yılda okyanus havzalarını değiştirir","Şiddetli volkanik patlamalar atmosfer bileşimini kısa sürede değiştirebilir","Yer şekilleri rüzgârın hızını, yönünü ve yağışın dağılışını etkiler","Dağ silsileleri hava kütlelerini yönlendirerek iklim farklılıkları yaratır"] },
  { id:"kriyosfer", no:3, ad:"Kriyosfer", latince:"Buzul Küre", icon:"🧊", color:"#94a3b8",
    tanim:"Donmuş topraklar, buzullar ve sürekli karla kaplı alanlardan oluşur. Dinamik ve değişken bir bileşendir.",
    ozellikler:["Yüksek albedoyla Güneş ışınımının büyük kısmını uzaya yansıtır","Buzulların erimesi deniz seviyesini yükseltir","Permafrost çözününce sera gazları (CO₂, metan) atmosfere salınır","Enerji ve nem dengesini etkileyerek sıcaklık-yağış dağılışını değiştirir"] },
  { id:"biyosfer",  no:4, ad:"Biyosfer",  latince:"Canlı Küre", icon:"🌿", color:"#166534",
    tanim:"Tüm canlı organizmaları kapsar. Canlılar hem iklim sistemini etkiler hem de iklim değişimlerinden etkilenir.",
    ozellikler:["Bitkiler önemli miktarda CO₂ depolar; karbon döngüsünde kritik rol oynar","Bitki örtüsü yüzey albedosunu etkileyerek iklimi değiştirir","Bitkilerin yüksekliği ve yoğunluğu rüzgâr hızı ve yönünü etkiler","Fitoplanktonlar atmosferdeki CO₂ oranını düzenler"] },
  { id:"atmosfer",  no:5, ad:"Atmosfer",  latince:"Hava Küre", icon:"🌬️", color:C,
    tanim:"İklimin beş bileşeni içinde en dinamik ve değişken olanıdır. Sürekli hareket hâlindeki hava, ısıyı, nemi ve bulutları taşır.",
    ozellikler:["Dünya enerji dengesini düzenler","Bulutlar Güneş ışınımını yansıtır ve yeryüzü ısısını hapseder","Sera gazları (CO₂, su buharı) kızılötesi ısının uzaya kaçışını engeller","Tüm hava olaylarının yaşandığı ortamdır"] },
];

interface Katman { id:string; ad:string; yukseklik:string; color:string; ozellikler:string[]; }
const KATMANLAR: Katman[] = [
  { id:"troposfer",  ad:"Troposfer",  yukseklik:"0-13 km",    color:"#0369a1",
    ozellikler:["Atmosferdeki gazların yaklaşık %80i bu katmandadır","Tüm hava olayları (rüzgâr, bulut, sis, yağmur) burada gerçekleşir","Yeryüzünden ışımayla ısınır; yükselildikçe sıcaklık düşer","Su buharının tamamına yakını bu katmandadır"] },
  { id:"stratosfer", ad:"Stratosfer", yukseklik:"13-30 km",   color:"#0891b2",
    ozellikler:["Dikey hava hareketleri görülmez","Yükselti arttıkça sıcaklık artar","Jet uçakları daha az çalkantılı olduğu için bu katmanda uçar","Zararlı morötesi ışınları süzen ozon tabakası (ozonosfer) bu katmandadır"] },
  { id:"mezosfer",   ad:"Mezosfer",   yukseklik:"30-80 km",   color:"#7c3aed",
    ozellikler:["Yukarı doğru çıkıldıkça sıcaklık azalır","Uzaydan gelen göktaşlarının büyük çoğunluğu bu katmanda parçalanarak toz hâline gelir"] },
  { id:"termosfer",  ad:"Termosfer",  yukseklik:"80-600 km",  color:"#be185d",
    ozellikler:["Oksijen ve azot atomlarının yüksek enerjili Güneş radyasyonunu emmesiyle sıcaklık artar","İyonlaşma sürecine bağlı olarak iletişim sağlanır","Kutup ışıkları bu katmanda oluşur"] },
  { id:"ekzosfer",   ad:"Ekzosfer",   yukseklik:"600+ km",    color:"#334155",
    ozellikler:["Atmosferin en dış katmanıdır","Yer çekimi azaldığından bazı gaz molekülleri uzaya kaçar","Atmosferin üst sınırı kesin olarak bilinemez"] },
];

interface Faktor { id:string; no:number; ad:string; icon:string; color:string; aciklama:string; }
const SICAKLIK_FAKTORLERI: Faktor[] = [
  { id:"gunes_acisi", no:1, ad:"Güneş Işınlarının Geliş Açısı", icon:"☀️", color:"#dc2626",
    aciklama:"Güneş ışınlarının dik açıyla geldiği yerlerde sıcaklık daha yüksektir. Dünya geoit şekli nedeniyle Ekvatorda ışınlar dik, kutuplarda eğik gelir; bu nedenle sıcaklık Ekvatorda fazla, kutuplarda azdır." },
  { id:"yukselti",    no:2, ad:"Yükselti", icon:"⛰️", color:"#78350f",
    aciklama:"Troposferde yükselti arttıkça sıcaklık azalır. Aynı enlem üzerindeki iki yerden yükseltisi fazla olanın sıcaklığı daha düşüktür. Kuzeydoğu Anadolunun düşük sıcaklık ortalaması buna örnektir." },
  { id:"guneslenme",  no:3, ad:"Güneşlenme Süresi", icon:"🌤️", color:"#d97706",
    aciklama:"Gündüz boyunca Güneşten gelen ışınlarla aydınlanma süresi ne kadar uzunsa sıcaklık o kadar yüksek olur. Güneşlenme süresi; mevsime, bakıya, enleme ve bulutluluk oranına göre değişir." },
  { id:"okyanus",     no:4, ad:"Okyanus Akıntıları", icon:"🌊", color:C,
    aciklama:"Okyanus suları, akıntılarla Ekvator ve kutuplar arasında yer değiştirerek geçtiği yerlerin sıcaklığını etkiler. Ekvatordan kaynaklanan akıntılar sıcak, kutuplardan kaynaklananlar soğuktur." },
  { id:"atmosfer_nemi",no:5,ad:"Atmosfer Nemi", icon:"💧", color:"#0891b2",
    aciklama:"Su buharı, Güneşten gelen enerjiyi soğurarak yer ışımasını engeller. Nemli bölgelerde sıcaklık farkları azalır. Nemin az olduğu çöller ve yüksek yerlerde günlük ve mevsimlik sıcaklık farkları fazladır." },
  { id:"ruzgarlar",  no:6, ad:"Rüzgârlar", icon:"💨", color:"#475569",
    aciklama:"Hava kütleleri oluştukları yerin sıcaklığını taşır. Ekvatoral yönden esen rüzgârlar sıcaklığı artırır, kutup yönünden esenler düşürür. Türkiyede güney kökenli rüzgârlar ısıtıcı, kuzey kökenli soğutucu etkilidir." },
  { id:"kara_deniz", no:7, ad:"Kara ve Denizlerin Etkisi", icon:"🏖️", color:"#0369a1",
    aciklama:"Özgül ısısı daha yüksek olan denizler karalara göre daha yavaş ısınıp soğur. Bu nedenle denizel alanlarda sıcaklık farkları azdır; karasal alanlarda ise günlük ve mevsimlik sıcaklık farkları fazladır." },
  { id:"bitki_ortusu",no:8,ad:"Bitki Örtüsü", icon:"🌿", color:"#166534",
    aciklama:"Bitki örtüsü, Güneş ışınlarının bir kısmını emerek gündüzleri yerin fazla ısınmasını önler. Geceleri de yerden ışıyan sıcaklığın bir bölümünü tutarak fazla soğumayı engeller. Kentsel ısı adası bu faktörlerle ilgilidir." },
];

const BASINC_FAKTORLERI: Faktor[] = [
  { id:"yer_cekimi",  no:1, ad:"Yer Çekimi",  icon:"🌍", color:C3,
    aciklama:"Dünya geoit şekli nedeniyle yer çekimi Ekvatoran kutuplara doğru artar. Buna bağlı olarak Ekvatoran kutuplara doğru hava basıncı da artar." },
  { id:"yuk_basinc",  no:2, ad:"Yükselti",    icon:"⛰️", color:"#78350f",
    aciklama:"Atmosferdeki gazların yoğunluğu yerden yükseldikçe azalır. Bu nedenle yükselti arttıkça basınç azalır. Yüksek dağlarda hava yoğunluğu ve basıncı daha azdır." },
  { id:"sic_basinc",  no:3, ad:"Sıcaklık",    icon:"🌡️", color:C2,
    aciklama:"Hava ısındıkça genleşir, hafifler ve yükselir; böylece basınç azalır. Soğumayla hava yoğunlaşır ve alçalır; basınç artar. Termik basınç merkezi bu şekilde oluşur. Ekvatorda sürekli alçak, kutuplarda sürekli yüksek basınç termik nedenlidir." },
  { id:"don_hareketi",no:4, ad:"Dünyanın Dönme Hareketi", icon:"🌀", color:C,
    aciklama:"Dünya ekseni etrafındaki dönüş, hava kütlelerinin 30° enlemlerinde yığılarak alçalmasına neden olur. 60° enlemlerinde farklı hava kütlelerinin karşılaşmasıyla hava yükselir ve alçak basınç oluşur. 30°deki yüksek basınç ve 60°deki alçak basınç dinamik kökenlidir." },
];

interface Ruzgar { id:string; tip:string; icon:string; color:string; aciklama:string; }
const RUZGAR_GRUPLARI: Ruzgar[] = [
  { id:"surekli", tip:"Sürekli Rüzgârlar", icon:"→", color:C,
    aciklama:"Sürekli basınç merkezleri arasında yıl boyunca esen rüzgârlardır: ALİZELER (30°DYB → 0°TAB, kıtaların doğu kıyılarına yağış), BATI RÜZGÂRLARI (30°DYB → 60°DAB, batı kıyılarına yağış), KUTUP RÜZGÂRLARI (90°TYB → 60°DAB, soğuk). Kuzey YK: sağa, Güney YK: sola sapar." },
  { id:"tropikal", tip:"Tropikal Rüzgârlar", icon:"🌀", color:"#dc2626",
    aciklama:"Sıcak kuşakta okyanuslar üzerinde oluşur. Hortum ve kasırgaya dönüşebilir. Bölgesel isimleri: Asya doğusunda TAYFUN, Meksika Körfezinde HURRICANE, ABDde TORNADO, Avustralyada WİLLY WİLLY." },
  { id:"mevsimlik", tip:"Mevsimlik (Devirli) Rüzgârlar", icon:"↕️", color:"#16a34a",
    aciklama:"Karalar ile okyanuslar arasındaki sıcaklık ve basınç farkı nedeniyle oluşur. Mevsimsel yön değiştirir. MUSON RÜZGÂRLARI: Yaz musonu (denizden karaya, yağışlı), Kış musonu (karadan denize, kurak). Güney ve GDA, Avustralya, Afrika Gine Körfezi kıyılarında etkili." },
  { id:"yerel", tip:"Yerel Rüzgârlar", icon:"🏔️", color:C5,
    aciklama:"Yerel basınç farkları sonucu oluşan dar ve kısa süreli rüzgârlardır. MELTEMLER: Kara-deniz meltemi (gündüz denizden karaya, gece karadan denize) ve dağ-vadi meltemi (gece dağdan vadiye, gündüz vadiden dağa). FÖN RÜZGÂRI: Yamaç boyunca yükselen havanın diğer yamaçta alçalmasıyla oluşan sıcak-kurutucu rüzgâr." },
];

const YAGIS_TURLERI: Ruzgar[] = [
  { id:"yukselim", tip:"Yükselim (Konveksiyonel) Yağışları", icon:"☁️", color:"#dc2626",
    aciklama:"Isınan havanın hafifleyip yükselerek hızla soğuması sonucunda yoğuşma meydana gelir. Sağanak şeklinde oluşur. Sel ve taşkınlara yol açabilir. Ekvatoral bölgede yıl boyunca, karasal iklim bölgelerinde mevsimsel olarak görülür." },
  { id:"yamac",    tip:"Yamaç (Orografik) Yağışları",        icon:"⛰️", color:"#16a34a",
    aciklama:"Nemli hava kütlesinin bir dağ yamacı boyunca yükselerek soğuması ve yoğuşması sonucunda oluşur. Dağların nemli hava kütlelerine açık yamaçlarında görülür. Türkiyede Kuzey Anadolu Dağları ve Toros Dağlarının denize bakan yamaçlarında yaygındır." },
  { id:"cephe",    tip:"Cephe (Frontal) Yağışları",           icon:"↗️", color:C3,
    aciklama:"Sıcaklık ve nem bakımından farklı özellikteki hava kütlelerinin karşılaştığı alanlarda görülür. Cephe adı verilen bu karşılaşma alanında sıcak hava kütlesi soğuk hava kütlesi üzerinde yükselir, soğur ve yağış oluşur. Orta kuşakta etkilidir." },
];

const TEST_ITEMS = [
  {q:"İklim sisteminin bileşenleri arasında Güneşten aldığı enerjiyi en fazla depolayabilen hangisidir?",opts:["Litosfer","Kriyosfer","Hidrosfer","Biyosfer"],correct:2,exp:"Hidrosferin en önemli özelliği, Güneşten aldığı enerjiyi diğer bileşenlere göre daha fazla depolayabilmesidir. Okyanusların bu enerjiyi atmosfere yavaş yavaş vermesi, sıcaklığın hızla değişmesini engeller."},
  {q:"Atmosferin katmanları arasında tüm hava olaylarının (rüzgâr, bulut, sis, yağmur) gerçekleştiği katman hangisidir?",opts:["Stratosfer","Mezosfer","Termosfer","Troposfer"],correct:3,exp:"Atmosferi oluşturan gazların yaklaşık %80i bütün hava olaylarının yaşandığı troposferde yer alır. Rüzgâr, bulut, sis, yağmur gibi hava olayları troposferde meydana gelir. Ayrıca su buharının tamamına yakını bu katmandadır."},
  {q:"Ozon tabakası (ozonosfer) hangi atmosfer katmanında yer alır?",opts:["Troposfer","Stratosfer","Mezosfer","Termosfer"],correct:1,exp:"Güneşten gelen ve canlılar için zararlı olan morötesi ışınların süzülmesini sağlayan ozon tabakası (ozonosfer) stratosfer katmanında yer alır. Stratosfer 13-30 km yüksekliğindedir."},
  {q:"Kriyosferin iklim sistemi üzerindeki en önemli etkilerinden biri hangisidir?",opts:["Okyanuslar arasında enerji taşıması","Yüksek albedosu sayesinde Güneş ışınımının büyük kısmını uzaya yansıtması","Hava olaylarını oluşturması","Okyanus akıntılarını harekete geçirmesi"],correct:1,exp:"Kar ve buz yüzeyleri yüksek albedoya sahiptir. Bu özellik, kriyosferin Güneş ışınımının büyük bir kısmını uzaya geri yansıtmasını sağlar. Böylece yeryüzü ve atmosfer arasındaki enerji dengesini düzenler."},
  {q:"Türkiyenin iklimini etkileyen ve kış aylarında sıcak ve kurak koşullar getiren basınç merkezi hangisidir?",opts:["İzlanda Dinamik Alçak Basınç Merkezi","Sibirya Termik Yüksek Basınç Merkezi","Basra Termik Alçak Basıncı","Asor Dinamik Yüksek Basınç Merkezi"],correct:3,exp:"Asor Dinamik Yüksek Basınç Merkezi, Türkiyede yaz aylarının sıcak ve kurak geçmesi üzerinde etkilidir. Kış aylarında etkili olduğu günlerde hava sıcaklığını yükseltir."},
  {q:"Alize rüzgârları hangi basınç merkezlerinden hangisine doğru eser?",opts:["60° enlemlerindeki Dinamik Alçak Basınçtan 30°e doğru","30° enlemlerindeki Dinamik Yüksek Basınçtan Ekvatordaki Termik Alçak Basınca doğru","Kutuplardan 60° Dinamik Alçak Basınca doğru","0° Termik Alçak Basınçtan 30° Dinamik Yüksek Basınca doğru"],correct:1,exp:"Alize rüzgârları; 30° enlemleri üzerindeki Dinamik Yüksek Basınç (DYB) alanlarından Ekvatordaki Termik Alçak Basınç (TAB) alanlarına doğru eser. Bu rüzgârlar kıtaların doğu kıyılarına bol yağış bırakır."},
  {q:"Nemli hava kütlesinin dağ yamacı boyunca yükselerek soğuması ve yoğuşmasıyla oluşan yağış türü hangisidir?",opts:["Yükselim (konveksiyonel) yağışı","Cephe (frontal) yağışı","Yamaç (orografik) yağışı","Muson yağışı"],correct:2,exp:"Yamaç (orografik) yağışları; nemli hava kütlesinin bir dağ yamacı boyunca yükselerek soğuması ve yoğuşması sonucunda oluşur. Türkiyede Kuzey Anadolu ve Toros Dağlarının denize bakan yamaçlarında bu tip yağışlar görülür."},
  {q:"Dünya üzerindeki sürekli basınç kuşakları incelendiğinde 60° enlemlerinde oluşan basınç merkezi hangi kökenlidir?",opts:["Termik kökenli alçak basınç","Dinamik kökenli yüksek basınç","Dinamik kökenli alçak basınç","Termik kökenli yüksek basınç"],correct:2,exp:"60° enlemlerinde farklı hava kütlelerinin karşılaşması sonucunda havanın yükselmesi basıncı düşürür ve alçak basınç alanları ortaya çıkar. Bu nedenle 60° enlemlerindeki alçak basınç dinamik kökenlidir. Bu farklı kökenli basınç merkezlerine Dinamik Alçak Basınç (DAB) denir."},
  {q:"Troposferde yükselti arttıkça sıcaklığın azalmasının temel nedeni hangisidir?",opts:["Ozon tabakasının Güneş ışınlarını emmesi","Troposferin yerden yansıyan ışınlarla ısınması ve su buharının büyük bölümünün yere yakın olması","Coriolis etkisinin rüzgârları saptırması","Kutup rüzgârlarının soğuk hava getirmesi"],correct:1,exp:"Troposferin yerden yansıyan ışınlarla ısınması ve ısıyı soğuran su buharı moleküllerinin büyük bölümünün yere yakın olması gibi etkenler, yerden yükseldikçe sıcaklığın düşmesine neden olur."},
  {q:"Türkiyenin farklı bölgelerinde görülen yağış dağılışını etkileyen en önemli faktörler hangileridir?",opts:["Yalnızca enlem ve okyanus akıntıları","Dağların uzanış doğrultusu, yükselti, bakı ve mevsimlere göre değişen basınç özellikleri","Yalnızca Türkiyeyi etkileyen basınç merkezleri","Yalnızca denizlere yakınlık ve sıcaklık"],correct:1,exp:"Türkiyede yağışın dağılışını dağların uzanış doğrultusu, yükselti, denizler, bakı özellikleri, mevsimlere göre farklılık gösteren basınç özellikleri gibi birçok coğrafi faktör etkiler. En çok yağış alan yer Rize, en az yağış alan yer Iğdır ile Tuz Gölü çevresidir."},
];

interface MK { id:string; text:string; cat:"hidrosfer"|"litosfer"|"kriyosfer"|"biyosfer"|"atmosfer"; }
const MATCH_ITEMS: MK[] = [
  {id:"m1",text:"Güneş enerjisini en fazla depolar",cat:"hidrosfer"},
  {id:"m2",text:"Ozon tabakası bu bileşende yer alır",cat:"atmosfer"},
  {id:"m3",text:"Permafrost çözündükçe sera gazı salar",cat:"kriyosfer"},
  {id:"m4",text:"Volkanik patlamalar bileşimi değiştirebilir",cat:"litosfer"},
  {id:"m5",text:"Bitkiler karbondioksit depolar",cat:"biyosfer"},
  {id:"m6",text:"Yüksek albedoyla Güneş ışınlarını yansıtır",cat:"kriyosfer"},
  {id:"m7",text:"Okyanus akıntılarıyla enerji taşır",cat:"hidrosfer"},
  {id:"m8",text:"Levha hareketleriyle yavaş iklim etkisi",cat:"litosfer"},
  {id:"m9",text:"Yer şekilleri rüzgâr ve yağışı etkiler",cat:"litosfer"},
  {id:"m10",text:"Sera gazları ısı kaçışını engeller",cat:"atmosfer"},
];

function EslestirmeAktisite() {
  const BUCKETS = [
    {id:"hidrosfer" as const, label:"Hidrosfer 🌊", color:"#0369a1"},
    {id:"litosfer"  as const, label:"Litosfer ⛰️",  color:"#78350f"},
    {id:"kriyosfer" as const, label:"Kriyosfer 🧊", color:"#94a3b8"},
    {id:"biyosfer"  as const, label:"Biyosfer 🌿",  color:"#166534"},
    {id:"atmosfer"  as const, label:"Atmosfer 🌬️", color:C},
  ];
  const [shuffled] = useState<MK[]>(()=>{ const a=[...MATCH_ITEMS]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; });
  const [placed,setPlaced] = useState<Record<string,string>>({});
  const [wrong,setWrong]   = useState<Record<string,boolean>>({});
  const [dragId,setDragId] = useState<string|null>(null);
  const [hovBucket,setHov] = useState<string|null>(null);
  const [score,setScore]   = useState(0);
  const [done,setDone]     = useState(false);
  const doDrop=(bid:string)=>{ if(!dragId)return; const item=shuffled.find(m=>m.id===dragId); if(!item||placed[dragId])return; const ok=item.cat===bid; sndDrop();if(ok){sndOK();setScore(s=>s+1);}else sndFail(); const np={...placed,[dragId]:bid}; const nw={...wrong,[dragId]:!ok}; setPlaced(np);setWrong(nw);setDragId(null);setHov(null); if(Object.keys(np).length===shuffled.length)setTimeout(()=>setDone(true),400); };
  const retry=()=>{setPlaced({});setWrong({});setScore(0);setDone(false);setDragId(null);};
  if(done)return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"16px",padding:"48px 24px",textAlign:"center"}}><div style={{fontSize:"52px"}}>🌍</div><div style={{fontSize:"26px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Eşleştirme Tamamlandı!</div><div style={{fontSize:"50px",fontWeight:"800",color:C,fontFamily:MONO}}>{score}/{shuffled.length}</div><div style={{fontSize:"14px",color:"#475569",fontFamily:FONT}}>doğru eşleştirme</div><button onClick={retry} style={{padding:"12px 28px",background:`linear-gradient(90deg,#0369a1,${C})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT}}>🔄 Tekrar Oyna</button></div>);
  const pending=shuffled.filter(m=>!placed[m.id]);
  return(<div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
    <div><div style={{fontSize:"10px",color:C,letterSpacing:"3px",fontWeight:"800",fontFamily:MONO,marginBottom:"4px"}}>ETKİNLİK</div><div style={{fontSize:"17px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>🌍 İklim Bileşenlerini Eşleştir</div><div style={{fontSize:"12px",color:"#475569",marginTop:"3px",fontFamily:FONT}}>Her özelliği doğru iklim sistemi bileşenine sürükle bırak</div></div>
    <div style={{padding:"12px 14px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"10px",minHeight:"48px"}}>
      <div style={{fontSize:"10px",color:"#475569",letterSpacing:"2px",fontWeight:"800",marginBottom:"8px",fontFamily:FONT}}>ÖZELLİKLER</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"7px"}}>
        {pending.map(item=>(<div key={item.id} draggable onDragStart={e=>{setDragId(item.id);e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",item.id);}} onDragEnd={()=>{setDragId(null);setHov(null);}} style={{padding:"8px 12px",background:dragId===item.id?`${C}20`:"rgba(0,0,0,0.4)",border:`1.5px solid ${dragId===item.id?C:"rgba(255,255,255,0.1)"}`,borderRadius:"8px",cursor:"grab",fontSize:"12px",fontWeight:"600",color:"#cbd5e1",fontFamily:FONT,userSelect:"none",WebkitUserSelect:"none",opacity:dragId===item.id?0.5:1}}>{item.text}</div>))}
        {shuffled.filter(m=>placed[m.id]).map(item=>(<div key={item.id} style={{padding:"8px 12px",background:wrong[item.id]?"rgba(239,68,68,0.08)":"rgba(52,211,153,0.08)",border:`1.5px solid ${wrong[item.id]?"#ef444430":"#34d39930"}`,borderRadius:"8px",fontSize:"12px",fontWeight:"600",color:wrong[item.id]?"#ef4444":"#34d399",fontFamily:FONT,opacity:0.65}}>{wrong[item.id]?"✗ ":"✓ "}{item.text}</div>))}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"8px"}}>
      {BUCKETS.map(bucket=>(<div key={bucket.id} onDragOver={e=>{e.preventDefault();e.dataTransfer.dropEffect="move";setHov(bucket.id);}} onDragLeave={()=>setHov(null)} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("text/plain");if(id){setDragId(id);setTimeout(()=>doDrop(bucket.id),0);}else doDrop(bucket.id);}} style={{minHeight:"120px",padding:"10px",background:hovBucket===bucket.id?`${bucket.color}18`:`${bucket.color}08`,border:`2px ${hovBucket===bucket.id?"solid":"dashed"} ${bucket.color}${hovBucket===bucket.id?"80":"35"}`,borderRadius:"10px",transition:"all 0.2s"}}>
        <div style={{fontSize:"12px",fontWeight:"800",color:bucket.color,marginBottom:"8px",fontFamily:FONT}}>{bucket.label}</div>
        <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>{shuffled.filter(m=>placed[m.id]===bucket.id).map(it=>(<div key={it.id} style={{padding:"5px 7px",background:wrong[it.id]?"rgba(239,68,68,0.12)":"rgba(52,211,153,0.12)",border:`1px solid ${wrong[it.id]?"#ef444440":"#34d39940"}`,borderRadius:"5px",fontSize:"10px",color:wrong[it.id]?"#ef4444":"#34d399",fontWeight:"600",fontFamily:FONT}}>{wrong[it.id]?"✗ ":"✓ "}{it.text}</div>))}</div>
      </div>))}
    </div>
    <div style={{padding:"8px 14px",background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"8px",display:"flex",justifyContent:"space-between"}}><span style={{fontSize:"12px",color:"#475569",fontFamily:FONT}}>Kalan: {pending.length} kart</span><span style={{fontSize:"14px",fontWeight:"800",color:C,fontFamily:MONO}}>{score} doğru</span></div>
  </div>);
}

function TestTab() {
  const [qIdx,setQIdx]=useState(0); const [sel,setSel]=useState<number|null>(null);
  const [score,setScore]=useState(0); const [answers,setAnswers]=useState<boolean[]>([]);
  const [done,setDone]=useState(false); const q=TEST_ITEMS[qIdx];
  const handleAnswer=(i:number)=>{ if(sel!==null)return; setSel(i); const ok=i===q.correct; if(ok){setScore(s=>s+10);sndOK();}else sndFail(); setAnswers(a=>[...a,ok]); };
  const next=()=>{ sndClick(); if(qIdx>=TEST_ITEMS.length-1){setDone(true);return;} setQIdx(i=>i+1); setSel(null); };
  const retry=()=>{ setQIdx(0);setSel(null);setScore(0);setAnswers([]);setDone(false); };
  if(done){ const pct=Math.round((score/(TEST_ITEMS.length*10))*100); return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"18px",padding:"40px",textAlign:"center"}}>
      <div style={{fontSize:"52px"}}>🌍</div>
      <div style={{fontSize:"26px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Test Tamamlandı!</div>
      <div style={{fontSize:"52px",fontWeight:"800",color:pct>=80?"#34d399":pct>=50?C5:"#ef4444",fontFamily:MONO}}>{score} PUAN</div>
      <div style={{fontSize:"14px",color:"#475569",fontFamily:FONT}}>{answers.filter(Boolean).length}/{TEST_ITEMS.length} doğru · %{pct}</div>
      <button onClick={retry} style={{padding:"13px 30px",background:`linear-gradient(90deg,#0369a1,${C})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT}}>🔄 Tekrar Dene</button>
    </div>); }
  return(<div style={{flex:1,display:"flex",overflow:"hidden"}}>
    <div style={{width:"210px",flexShrink:0,borderRight:`1px solid ${C}10`,background:PANEL,padding:"18px 12px",display:"flex",flexDirection:"column",gap:"5px",overflowY:"auto"}}>
      <div style={{fontSize:"11px",letterSpacing:"2px",color:"#475569",fontWeight:"800",fontFamily:FONT,marginBottom:"4px"}}>SORULAR</div>
      {TEST_ITEMS.map((_,i)=>{ const d=i<answers.length,cur=i===qIdx; return(<div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"7px 9px",background:cur?`${C}10`:"rgba(0,0,0,0.15)",border:`1.5px solid ${cur?C:d?(answers[i]?"rgba(52,211,153,0.3)":"rgba(239,68,68,0.3)"):"rgba(255,255,255,0.04)"}`,borderRadius:"7px"}}><div style={{width:"19px",height:"19px",borderRadius:"50%",background:d?(answers[i]?"#34d399":"#ef4444"):cur?C:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",fontWeight:"800",color:"#fff",flexShrink:0,fontFamily:MONO}}>{d?(answers[i]?"✓":"✗"):i+1}</div><span style={{fontSize:"11px",fontWeight:"700",color:cur?C:d?(answers[i]?"#34d399":"#ef4444"):"#334155",fontFamily:FONT}}>Soru {i+1}</span></div>); })}
      <div style={{marginTop:"auto",padding:"10px",background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"8px",textAlign:"center"}}><div style={{fontSize:"10px",color:"#475569",fontWeight:"700",fontFamily:FONT,marginBottom:"3px"}}>PUAN</div><div style={{fontSize:"28px",fontWeight:"800",color:C,fontFamily:MONO}}>{score}</div><div style={{fontSize:"10px",color:"#334155",fontFamily:FONT}}>/ {TEST_ITEMS.length*10}</div></div>
    </div>
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"24px 28px",overflowY:"auto",gap:"14px"}}>
      <div style={{width:"100%",maxWidth:"640px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"7px"}}><span style={{fontSize:"12px",color:"#475569",fontWeight:"700",fontFamily:FONT}}>SORU {qIdx+1}/{TEST_ITEMS.length}</span><span style={{fontSize:"12px",color:C,fontFamily:FONT}}>{Math.round((qIdx/TEST_ITEMS.length)*100)}%</span></div><div style={{height:"4px",background:`${C}18`,borderRadius:"2px",overflow:"hidden"}}><div style={{height:"100%",width:`${(qIdx/TEST_ITEMS.length)*100}%`,background:`linear-gradient(90deg,#0369a1,${C})`,borderRadius:"2px",transition:"width 0.4s"}}/></div></div>
      <div style={{maxWidth:"640px",width:"100%",padding:"18px 22px",background:`${C}08`,border:`1.5px solid ${C}20`,borderRadius:"14px"}}><p style={{fontSize:"15px",color:"#e2e8f0",lineHeight:"1.9",margin:0,fontWeight:"600",fontFamily:FONT}}>{q.q}</p></div>
      <div style={{maxWidth:"640px",width:"100%",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
        {q.opts.map((opt,i)=>{ const isSel=sel===i,isCorr=i===q.correct,show=sel!==null; let bg="rgba(0,0,0,0.25)",border="rgba(255,255,255,0.07)",color="#64748b"; if(show){if(isCorr){bg="#34d39912";border="#34d399";color="#34d399";}else if(isSel){bg="rgba(239,68,68,0.1)";border="#ef4444";color="#ef4444";}} return(<button key={i} onClick={()=>handleAnswer(i)} disabled={sel!==null} style={{padding:"12px 14px",background:bg,border:`2px solid ${border}`,borderRadius:"10px",cursor:sel!==null?"default":"pointer",fontFamily:FONT,textAlign:"left",transition:"all 0.18s"}}><div style={{display:"flex",alignItems:"flex-start",gap:"8px"}}><span style={{width:"20px",height:"20px",borderRadius:"50%",background:show&&isCorr?"#34d399":show&&isSel?"#ef4444":`${C}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",fontWeight:"800",color:show?"#fff":"#94a3b8",flexShrink:0,marginTop:"1px",fontFamily:MONO}}>{show&&isCorr?"✓":show&&isSel&&!isCorr?"✗":String.fromCharCode(65+i)}</span><span style={{fontSize:"13px",color,fontWeight:"600",lineHeight:"1.6",fontFamily:FONT}}>{opt}</span></div></button>); })}
      </div>
      {sel!==null&&(<div style={{maxWidth:"640px",width:"100%",padding:"14px 17px",background:sel===q.correct?"rgba(52,211,153,0.07)":"rgba(239,68,68,0.07)",border:`1.5px solid ${sel===q.correct?"rgba(52,211,153,0.25)":"rgba(239,68,68,0.25)"}`,borderRadius:"12px"}}><div style={{fontSize:"14px",fontWeight:"800",color:sel===q.correct?"#34d399":"#ef4444",marginBottom:"7px",fontFamily:FONT}}>{sel===q.correct?"✅ DOĞRU!":"❌ YANLIŞ!"}</div><p style={{fontSize:"13px",color:"#64748b",lineHeight:"1.85",margin:0,fontFamily:FONT}}>{q.exp}</p></div>)}
      {sel!==null&&(<button onClick={next} style={{padding:"11px 32px",background:`linear-gradient(90deg,#0369a1,${C})`,border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"800",cursor:"pointer",fontFamily:FONT}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)"}} onMouseLeave={e=>{e.currentTarget.style.transform="none"}}>{qIdx>=TEST_ITEMS.length-1?"🏁 Sonuçları Gör":"⏭ Sonraki Soru"}</button>)}
    </div>
  </div>);
}

export default function IklimSistemiActivity({ onClose }: { onClose: () => void }) {
  const [tab,setTab]             = useState<Tab>("learn");
  const [sec,setSec]             = useState<LearnSec>("bilesenleri");
  const [activeBilesen,setActiveB] = useState<string>("hidrosfer");
  const [activeKatman,setActiveK]  = useState<string>("troposfer");
  const [activeSicFak,setActiveSF] = useState<string>("gunes_acisi");
  const [activeBasFak,setActiveBF] = useState<string>("yer_cekimi");
  const [activeRuzgar,setActiveRZ] = useState<string>("surekli");
  const [activeYagis,setActiveYG]  = useState<string>("yukselim");

  const TABS = [
    {id:"learn" as Tab,icon:"📖",label:"ÖĞREN"},
    {id:"act"   as Tab,icon:"🌍",label:"ETKİNLİK"},
    {id:"test"  as Tab,icon:"✏️",label:"TEST"},
  ];
  const SECTIONS: {id:LearnSec;icon:string;label:string;color:string}[] = [
    {id:"bilesenleri",        icon:"🌐",label:"İklim Sistemi Bileşenleri",color:C},
    {id:"atmosfer_katmanlari",icon:"🛰️",label:"Atmosferin Katmanları",    color:C3},
    {id:"sicaklik",           icon:"🌡️",label:"Sıcaklık Değişkeni",       color:C2},
    {id:"basinc",             icon:"🌀",label:"Basınç Değişkeni",          color:"#7c3aed"},
    {id:"ruzgarlar",          icon:"💨",label:"Rüzgârlar",                 color:"#94a3b8"},
    {id:"yagis",              icon:"🌧️",label:"Nem & Yağış",               color:C4},
  ];

  return(
    <div style={{position:"fixed",inset:0,zIndex:1000,background:BG,display:"flex",flexDirection:"column",fontFamily:FONT,userSelect:"none",WebkitUserSelect:"none"}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {/* Üst bar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",height:"64px",borderBottom:`1px solid ${C}1a`,background:"rgba(2,4,12,0.96)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"22px"}}>
          <div><div style={{fontSize:"10px",letterSpacing:"4px",color:C,opacity:0.6,fontFamily:MONO}}>3. ÜNİTE — DOĞAL SİSTEMLER</div><div style={{fontSize:"19px",fontWeight:"800",color:"#e2e8f0"}}>İklim Sistemini Anlamak</div></div>
          <div style={{display:"flex",gap:"3px",background:"rgba(0,0,0,0.4)",padding:"4px",borderRadius:"10px"}}>
            {TABS.map(t=>(<button key={t.id} onClick={()=>{sndClick();setTab(t.id);}} style={{padding:"7px 18px",borderRadius:"7px",border:"none",cursor:"pointer",fontFamily:FONT,fontSize:"12px",fontWeight:"700",transition:"all 0.18s",background:tab===t.id?C:"transparent",color:tab===t.id?"#fff":"#334155"}}>{t.icon} {t.label}</button>))}
          </div>
        </div>
        <button onClick={onClose} style={{padding:"8px 18px",background:"transparent",border:"1px solid rgba(255,80,80,0.3)",borderRadius:"8px",color:"#f87171",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:FONT}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,80,80,0.1)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>✕ KAPAT</button>
      </div>
      <div style={{flex:1,overflow:"hidden",display:"flex",minHeight:0}}>

        {/* ÖĞREN */}
        {tab==="learn" && (
          <div style={{flex:1,display:"flex",overflow:"hidden"}}>
            {/* Sol menü */}
            <div style={{width:"218px",flexShrink:0,borderRight:`1px solid ${C}12`,background:PANEL,overflowY:"auto",padding:"16px 12px"}}>
              <div style={{fontSize:"11px",letterSpacing:"2px",color:"#475569",fontWeight:"800",fontFamily:FONT,marginBottom:"10px"}}>KONULAR</div>
              <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                {SECTIONS.map(s=>(<button key={s.id} onClick={()=>{sndClick();setSec(s.id);}} style={{padding:"9px 12px",background:sec===s.id?`${s.color}14`:"rgba(0,0,0,0.2)",border:`1.5px solid ${sec===s.id?s.color:"rgba(255,255,255,0.04)"}`,borderRadius:"8px",cursor:"pointer",textAlign:"left",fontFamily:FONT,transition:"all 0.18s",display:"flex",gap:"8px",alignItems:"center"}}><span style={{fontSize:"16px"}}>{s.icon}</span><span style={{fontSize:"12px",fontWeight:"800",color:sec===s.id?s.color:"#334155"}}>{s.label}</span></button>))}
              </div>
              <div style={{height:"1px",background:`${C}10`,margin:"16px 0"}}/>
              <div style={{fontSize:"11px",letterSpacing:"2px",color:"#475569",fontWeight:"800",fontFamily:FONT,marginBottom:"10px"}}>HIZLI ÖZET</div>
              <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                {[["5 Bileşen","Atmosfer,Hidrosfer,Litosfer,Kriyosfer,Biyosfer",C],["4 Değişken","Sıcaklık,Basınç,Rüzgâr,Yağış",C5],["4 Katman","Troposfer→Stratosfer→Mezosfer→Termosfer",C3],["4 Rüzgâr","Sürekli,Tropikal,Mevsimlik,Yerel","#94a3b8"],["3 Yağış","Konveksiyonel,Orografik,Frontal",C4]].map(([k,v,c])=>(<div key={k} style={{padding:"7px 9px",background:"rgba(0,0,0,0.2)",borderRadius:"6px",borderLeft:`2px solid ${c}`}}><div style={{fontSize:"11px",color:String(c),fontWeight:"800",fontFamily:FONT}}>{k}</div><div style={{fontSize:"10px",color:"#334155",fontFamily:FONT,marginTop:"2px"}}>{v}</div></div>))}
              </div>
            </div>
            {/* Sağ içerik */}
            <div style={{flex:1,overflowY:"auto",padding:"22px 26px",display:"flex",flexDirection:"column",gap:"16px",background:`radial-gradient(ellipse at 10% 10%,${C}06 0%,${BG} 65%)`}}>

              {/* BİLEŞENLER */}
              {sec==="bilesenleri" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"14px"}}>
                  <div><div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"7px"}}><span style={{fontSize:"28px"}}>🌐</span><div><div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>İklim Sisteminin Bileşenleri</div><div style={{fontSize:"13px",color:C,fontWeight:"600",fontFamily:FONT}}>Atmosfer · Hidrosfer · Litosfer · Kriyosfer · Biyosfer</div></div></div><div style={{height:"2px",background:`linear-gradient(90deg,${C},transparent)`,opacity:0.35,borderRadius:"2px"}}/></div>
                  <div style={{padding:"14px 18px",background:`${C}0a`,border:`1.5px solid ${C}20`,borderRadius:"12px"}}><p style={{fontSize:"14px",color:"#94a3b8",lineHeight:"1.95",margin:0,fontFamily:FONT}}>İklim sistemi; <strong style={{color:C}}>atmosfer, hidrosfer, kriyosfer, litosfer, biyosfer</strong> olmak üzere beş ana bileşen ve bu bileşenler arasındaki etkileşimden oluşan son derece karmaşık bir sistemdir. İklim değişkenleri olan <strong style={{color:C5}}>sıcaklık, nem, yağış, hava basıncı ve rüzgâr</strong> da iklim sisteminin işleyişinde anahtar rol oynar.</p></div>
                  {/* 5 Bileşen seçici */}
                  <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
                    {BILESENLERI.map(b=>(<button key={b.id} onClick={()=>{sndClick();setActiveB(b.id);}} style={{display:"flex",alignItems:"center",gap:"7px",padding:"9px 14px",background:activeBilesen===b.id?`${b.color}20`:`${b.color}08`,border:`1.5px solid ${activeBilesen===b.id?b.color:`${b.color}25`}`,borderRadius:"9px",cursor:"pointer",fontFamily:FONT,transition:"all 0.2s"}}><span style={{fontSize:"18px"}}>{b.icon}</span><div style={{textAlign:"left"}}><div style={{fontSize:"12px",fontWeight:"800",color:activeBilesen===b.id?b.color:"#475569"}}>{b.ad}</div><div style={{fontSize:"10px",color:`${b.color}80`}}>{b.latince}</div></div></button>))}
                  </div>
                  {/* Seçili bileşen */}
                  {(() => { const b=BILESENLERI.find(x=>x.id===activeBilesen); if(!b)return null; return(<div style={{padding:"16px 18px",background:`${b.color}0d`,border:`1.5px solid ${b.color}28`,borderRadius:"12px",animation:"fadeUp 0.2s ease"}}><div style={{display:"flex",gap:"10px",alignItems:"center",marginBottom:"10px"}}><span style={{fontSize:"26px"}}>{b.icon}</span><div><div style={{fontSize:"16px",fontWeight:"800",color:b.color,fontFamily:FONT}}>{b.no}. {b.ad} — {b.latince}</div></div></div><p style={{fontSize:"13px",color:"#94a3b8",lineHeight:"1.85",margin:"0 0 12px",fontFamily:FONT}}>{b.tanim}</p><div style={{fontSize:"11px",color:b.color,letterSpacing:"1.5px",fontWeight:"800",marginBottom:"8px",fontFamily:FONT}}>ÖNEMLİ ÖZELLİKLER</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px"}}>{b.ozellikler.map(o=>(<div key={o} style={{padding:"7px 10px",background:"rgba(0,0,0,0.2)",borderRadius:"6px",borderLeft:`2px solid ${b.color}60`,fontSize:"12px",color:"#475569",lineHeight:"1.6",fontFamily:FONT}}>{o}</div>))}</div></div>); })()}
                </div>
              )}

              {/* ATMOSFER KATMANLARI */}
              {sec==="atmosfer_katmanlari" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"14px"}}>
                  <div><div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"7px"}}><span style={{fontSize:"28px"}}>🛰️</span><div><div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Atmosferin Katmanları</div><div style={{fontSize:"13px",color:C3,fontWeight:"600",fontFamily:FONT}}>Troposfer · Stratosfer · Mezosfer · Termosfer · Ekzosfer</div></div></div><div style={{height:"2px",background:`linear-gradient(90deg,${C3},transparent)`,opacity:0.35,borderRadius:"2px"}}/></div>
                  {/* Katman seçici — dikey SVG timeline */}
                  <div style={{display:"flex",gap:"14px",flexWrap:"wrap"}}>
                    {/* Katman listesi */}
                    <div style={{display:"flex",flexDirection:"column",gap:"6px",minWidth:"160px"}}>
                      {KATMANLAR.map(k=>(<button key={k.id} onClick={()=>{sndClick();setActiveK(k.id);}} style={{padding:"9px 12px",background:activeKatman===k.id?`${k.color}20`:`${k.color}08`,border:`1.5px solid ${activeKatman===k.id?k.color:`${k.color}25`}`,borderRadius:"9px",cursor:"pointer",textAlign:"left",fontFamily:FONT,transition:"all 0.2s"}}><div style={{fontSize:"13px",fontWeight:"800",color:activeKatman===k.id?k.color:"#475569"}}>{k.ad}</div><div style={{fontSize:"10px",color:`${k.color}80`}}>{k.yukseklik}</div></button>))}
                    </div>
                    {/* Seçili katman detayı */}
                    {(() => { const k=KATMANLAR.find(x=>x.id===activeKatman); if(!k)return null; return(<div style={{flex:1,padding:"16px 18px",background:`${k.color}0d`,border:`1.5px solid ${k.color}28`,borderRadius:"12px",animation:"fadeUp 0.2s ease"}}><div style={{fontSize:"16px",fontWeight:"800",color:k.color,marginBottom:"6px",fontFamily:FONT}}>{k.ad} <span style={{fontSize:"12px",color:`${k.color}80`,fontFamily:MONO}}>({k.yukseklik})</span></div><div style={{display:"flex",flexDirection:"column",gap:"6px"}}>{k.ozellikler.map(o=>(<div key={o} style={{padding:"8px 11px",background:"rgba(0,0,0,0.2)",borderRadius:"7px",borderLeft:`2px solid ${k.color}60`,fontSize:"13px",color:"#94a3b8",lineHeight:"1.7",fontFamily:FONT}}>{o}</div>))}</div></div>); })()}
                  </div>
                  {/* Troposfer notu */}
                  <div style={{padding:"12px 16px",background:`${C}08`,border:`1px solid ${C}18`,borderRadius:"9px",fontSize:"13px",color:"#64748b",lineHeight:"1.8",fontFamily:FONT}}>
                    <strong style={{color:C}}>Önemli Not:</strong> Troposfer, tüm hava olaylarının yaşandığı katmandır. Atmosferdeki gazların ~%80i burada bulunur. Tüm su buharı troposferde yoğunlaşmıştır. Yukarı doğru her 1000 metrede sıcaklık yaklaşık 6.5°C düşer.
                  </div>
                </div>
              )}

              {/* SICAKLIK */}
              {sec==="sicaklik" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"14px"}}>
                  <div><div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"7px"}}><span style={{fontSize:"28px"}}>🌡️</span><div><div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Sıcaklık Değişkeni</div><div style={{fontSize:"13px",color:C2,fontWeight:"600",fontFamily:FONT}}>Sıcaklığın Dağılışına Etki Eden 8 Faktör</div></div></div><div style={{height:"2px",background:`linear-gradient(90deg,${C2},transparent)`,opacity:0.35,borderRadius:"2px"}}/></div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"7px"}}>
                    {SICAKLIK_FAKTORLERI.map(f=>(<button key={f.id} onClick={()=>{sndClick();setActiveSF(f.id);}} style={{padding:"10px 8px",background:activeSicFak===f.id?`${f.color}20`:`${f.color}08`,border:`1.5px solid ${activeSicFak===f.id?f.color:`${f.color}25`}`,borderRadius:"9px",cursor:"pointer",textAlign:"center",fontFamily:FONT,transition:"all 0.2s"}}><div style={{fontSize:"20px",marginBottom:"4px"}}>{f.icon}</div><div style={{fontSize:"10px",fontWeight:"800",color:activeSicFak===f.id?f.color:"#475569",lineHeight:"1.4"}}>{f.no}. {f.ad}</div></button>))}
                  </div>
                  {(() => { const f=SICAKLIK_FAKTORLERI.find(x=>x.id===activeSicFak); if(!f)return null; return(<div style={{padding:"16px 18px",background:`${f.color}0d`,border:`1.5px solid ${f.color}28`,borderRadius:"12px",animation:"fadeUp 0.2s ease"}}><div style={{fontSize:"16px",fontWeight:"800",color:f.color,marginBottom:"10px",fontFamily:FONT}}>{f.icon} {f.no}. {f.ad}</div><p style={{fontSize:"13px",color:"#94a3b8",lineHeight:"1.9",margin:0,fontFamily:FONT}}>{f.aciklama}</p></div>); })()}
                  {/* Türkiye sıcaklık notu */}
                  <div style={{padding:"12px 16px",background:"rgba(249,115,22,0.07)",border:"1px solid rgba(249,115,22,0.2)",borderRadius:"9px",fontSize:"13px",color:"#64748b",lineHeight:"1.8",fontFamily:FONT}}>
                    <strong style={{color:C2}}>Türkiyede Sıcaklık:</strong> Güneyden kuzeye azalmasında <em>enlem</em>, batıdan doğuya azalmasında <em>yükselti</em> etkilidir. En fazla güneşlenme: Şanlıurfa-Mardin (3.250 saat/yıl). En az: Trabzon-Rize-Artvin (1.750 saat/yıl).
                  </div>
                </div>
              )}

              {/* BASINÇ */}
              {sec==="basinc" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"14px"}}>
                  <div><div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"7px"}}><span style={{fontSize:"28px"}}>🌀</span><div><div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Basınç Değişkeni</div><div style={{fontSize:"13px",color:"#7c3aed",fontWeight:"600",fontFamily:FONT}}>Basıncın Dağılışına Etki Eden 4 Faktör</div></div></div><div style={{height:"2px",background:"linear-gradient(90deg,#7c3aed,transparent)",opacity:0.35,borderRadius:"2px"}}/></div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"7px"}}>
                    {BASINC_FAKTORLERI.map(f=>(<button key={f.id} onClick={()=>{sndClick();setActiveBF(f.id);}} style={{padding:"10px 8px",background:activeBasFak===f.id?`${f.color}20`:`${f.color}08`,border:`1.5px solid ${activeBasFak===f.id?f.color:`${f.color}25`}`,borderRadius:"9px",cursor:"pointer",textAlign:"center",fontFamily:FONT,transition:"all 0.2s"}}><div style={{fontSize:"20px",marginBottom:"4px"}}>{f.icon}</div><div style={{fontSize:"10px",fontWeight:"800",color:activeBasFak===f.id?f.color:"#475569",lineHeight:"1.4"}}>{f.no}. {f.ad}</div></button>))}
                  </div>
                  {(() => { const f=BASINC_FAKTORLERI.find(x=>x.id===activeBasFak); if(!f)return null; return(<div style={{padding:"16px 18px",background:`${f.color}0d`,border:`1.5px solid ${f.color}28`,borderRadius:"12px",animation:"fadeUp 0.2s ease"}}><div style={{fontSize:"16px",fontWeight:"800",color:f.color,marginBottom:"10px",fontFamily:FONT}}>{f.icon} {f.no}. {f.ad}</div><p style={{fontSize:"13px",color:"#94a3b8",lineHeight:"1.9",margin:0,fontFamily:FONT}}>{f.aciklama}</p></div>); })()}
                  {/* Sürekli basınç kuşakları */}
                  <div style={{padding:"14px 16px",background:"rgba(124,58,237,0.07)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:"10px"}}>
                    <div style={{fontSize:"11px",color:"#7c3aed",letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT}}>SÜREKLİ BASINÇ KUŞAKLARI</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px"}}>
                      {[["0° TAB","Termik Alçak Basınç","Ekvator; yükselici hava, yağışlı","#0369a1"],["30° DYB","Dinamik Yüksek Basınç","Dönenceler; alçalıcı hava, kurak","#d97706"],["60° DAB","Dinamik Alçak Basınç","Orta enlem; yükselici hava, yağışlı","#7c3aed"],["90° TYB","Termik Yüksek Basınç","Kutuplar; alçalıcı hava, kurak","#94a3b8"]].map(([kod,tip,acik,c])=>(<div key={kod} style={{padding:"9px 11px",background:`${c}0d`,border:`1px solid ${c}25`,borderRadius:"8px"}}><div style={{fontSize:"13px",fontWeight:"800",color:c,fontFamily:MONO,marginBottom:"3px"}}>{kod}</div><div style={{fontSize:"11px",fontWeight:"700",color:"#94a3b8",fontFamily:FONT,marginBottom:"3px"}}>{tip}</div><div style={{fontSize:"11px",color:"#475569",fontFamily:FONT}}>{acik}</div></div>))}
                    </div>
                  </div>
                  {/* Türkiye basınç merkezleri */}
                  <div style={{padding:"14px 16px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.18)",borderRadius:"10px"}}>
                    <div style={{fontSize:"11px",color:C5,letterSpacing:"2px",fontWeight:"800",marginBottom:"10px",fontFamily:FONT}}>TÜRKİYEYİ ETKİLEYEN BASINÇ MERKEZLERİ</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px"}}>
                      {[["İzlanda AB","Kış — batı/kuzeybatıdan yağış getirir","#0369a1"],["Sibirya YB","Kış — soğuk ve yağışsız günler","#94a3b8"],["Asor YB","Yaz — sıcak ve kurak; kışta ısıtıcı","#d97706"],["Basra AB","Yaz — sıcak, yağışsız, bunaltıcı günler","#dc2626"]].map(([m,etki,c])=>(<div key={m} style={{padding:"9px 11px",background:`${c}0d`,border:`1px solid ${c}25`,borderRadius:"8px"}}><div style={{fontSize:"12px",fontWeight:"800",color:c,fontFamily:FONT,marginBottom:"3px"}}>{m}</div><div style={{fontSize:"11px",color:"#64748b",fontFamily:FONT}}>{etki}</div></div>))}
                    </div>
                  </div>
                </div>
              )}

              {/* RÜZGÂRLAR */}
              {sec==="ruzgarlar" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"14px"}}>
                  <div><div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"7px"}}><span style={{fontSize:"28px"}}>💨</span><div><div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Rüzgârlar</div><div style={{fontSize:"13px",color:"#94a3b8",fontWeight:"600",fontFamily:FONT}}>Sürekli · Tropikal · Mevsimlik · Yerel</div></div></div><div style={{height:"2px",background:"linear-gradient(90deg,#94a3b8,transparent)",opacity:0.35,borderRadius:"2px"}}/></div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"7px"}}>
                    {RUZGAR_GRUPLARI.map(r=>(<button key={r.id} onClick={()=>{sndClick();setActiveRZ(r.id);}} style={{padding:"10px 8px",background:activeRuzgar===r.id?`${r.color}20`:`${r.color}08`,border:`1.5px solid ${activeRuzgar===r.id?r.color:`${r.color}25`}`,borderRadius:"9px",cursor:"pointer",textAlign:"center",fontFamily:FONT,transition:"all 0.2s"}}><div style={{fontSize:"20px",marginBottom:"4px"}}>{r.icon}</div><div style={{fontSize:"10px",fontWeight:"800",color:activeRuzgar===r.id?r.color:"#475569",lineHeight:"1.4"}}>{r.tip}</div></button>))}
                  </div>
                  {(() => { const r=RUZGAR_GRUPLARI.find(x=>x.id===activeRuzgar); if(!r)return null; return(<div style={{padding:"16px 18px",background:`${r.color}0d`,border:`1.5px solid ${r.color}28`,borderRadius:"12px",animation:"fadeUp 0.2s ease"}}><div style={{fontSize:"16px",fontWeight:"800",color:r.color,marginBottom:"10px",fontFamily:FONT}}>{r.icon} {r.tip}</div><p style={{fontSize:"13px",color:"#94a3b8",lineHeight:"1.9",margin:0,fontFamily:FONT}}>{r.aciklama}</p></div>); })()}
                  {/* Türkiye yerel rüzgârları */}
                  <div style={{padding:"13px 16px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.15)",borderRadius:"9px"}}>
                    <div style={{fontSize:"11px",color:C5,letterSpacing:"2px",fontWeight:"800",marginBottom:"8px",fontFamily:FONT}}>TÜRKİYEDE YEREL RÜZGÂRLAR</div>
                    <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
                      {[["Poyraz","K","Soğuk, zaman zaman yağışlı"],["Yıldız","KK","Soğuk, yağışlı"],["Karayel","KB","Soğutucı, yağışlı"],["Lodos","GB","Sıcak-ılık, ardından yağmur"],["Kıble","G","Güney, sıcak"],["Keşişleme","G","Sıcak, kuru, tozlu; Güneydoğuda etkili"]].map(([ad,yon,acik])=>(<div key={ad} style={{padding:"7px 10px",background:"rgba(0,0,0,0.25)",borderRadius:"7px",borderLeft:`2px solid ${C5}50`}}><div style={{fontSize:"11px",fontWeight:"800",color:C5,fontFamily:FONT}}>{ad} ({yon})</div><div style={{fontSize:"10px",color:"#475569",fontFamily:FONT,marginTop:"2px"}}>{acik}</div></div>))}
                    </div>
                  </div>
                </div>
              )}

              {/* YAĞIŞ */}
              {sec==="yagis" && (
                <div style={{animation:"fadeUp 0.22s ease",display:"flex",flexDirection:"column",gap:"14px"}}>
                  <div><div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"7px"}}><span style={{fontSize:"28px"}}>🌧️</span><div><div style={{fontSize:"21px",fontWeight:"800",color:"#e2e8f0",fontFamily:FONT}}>Nem & Yağış</div><div style={{fontSize:"13px",color:C4,fontWeight:"600",fontFamily:FONT}}>3 Yağış Türü · Türkiyede Yağış Dağılışı</div></div></div><div style={{height:"2px",background:`linear-gradient(90deg,${C4},transparent)`,opacity:0.35,borderRadius:"2px"}}/></div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
                    {YAGIS_TURLERI.map(y=>(<button key={y.id} onClick={()=>{sndClick();setActiveYG(y.id);}} style={{padding:"12px 10px",background:activeYagis===y.id?`${y.color}20`:`${y.color}08`,border:`1.5px solid ${activeYagis===y.id?y.color:`${y.color}25`}`,borderRadius:"10px",cursor:"pointer",textAlign:"center",fontFamily:FONT,transition:"all 0.2s"}}><div style={{fontSize:"24px",marginBottom:"5px"}}>{y.icon}</div><div style={{fontSize:"11px",fontWeight:"800",color:activeYagis===y.id?y.color:"#475569",lineHeight:"1.4"}}>{y.tip}</div></button>))}
                  </div>
                  {(() => { const y=YAGIS_TURLERI.find(x=>x.id===activeYagis); if(!y)return null; return(<div style={{padding:"16px 18px",background:`${y.color}0d`,border:`1.5px solid ${y.color}28`,borderRadius:"12px",animation:"fadeUp 0.2s ease"}}><div style={{fontSize:"16px",fontWeight:"800",color:y.color,marginBottom:"10px",fontFamily:FONT}}>{y.icon} {y.tip}</div><p style={{fontSize:"13px",color:"#94a3b8",lineHeight:"1.9",margin:0,fontFamily:FONT}}>{y.aciklama}</p></div>); })()}
                  {/* Türkiye yağış notu */}
                  <div style={{padding:"13px 16px",background:`${C4}07`,border:`1px solid ${C4}18`,borderRadius:"9px",fontSize:"13px",fontFamily:FONT}}>
                    <div style={{color:C4,fontWeight:"800",marginBottom:"7px",fontSize:"11px",letterSpacing:"1.5px"}}>TÜRKİYEDE YAĞIŞ DAĞILIŞI</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px"}}>
                      {[["En fazla yağış","Doğu & Batı Karadeniz kıyıları; güneye bakan Akdeniz yamaçları; Rize (2302 mm)","#34d399"],["En az yağış","Güneydoğu Anadolu (Şanlıurfa çevresi), İç Anadolu; Iğdır ve Tuz Gölü çevresi","#ef4444"]].map(([t,a,c])=>(<div key={t} style={{padding:"9px 11px",background:`${c}0d`,border:`1px solid ${c}25`,borderRadius:"8px"}}><div style={{fontSize:"11px",fontWeight:"800",color:c,fontFamily:FONT,marginBottom:"4px"}}>{t}</div><div style={{fontSize:"11px",color:"#475569",fontFamily:FONT,lineHeight:"1.65"}}>{a}</div></div>))}
                    </div>
                    <div style={{marginTop:"8px",fontSize:"12px",color:"#475569",lineHeight:"1.7"}}>Dağların uzanış doğrultusu, yükselti, denizler, bakı özellikleri ve mevsimlere göre değişen basınç koşulları yağış dağılışını belirler.</div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ETKİNLİK */}
        {tab==="act" && (
          <div style={{flex:1,overflowY:"auto",padding:"22px 26px",background:`radial-gradient(ellipse at 5% 5%,${C}05 0%,${BG} 60%)`}}>
            <EslestirmeAktisite/>
          </div>
        )}

        {/* TEST */}
        {tab==="test" && (<div style={{flex:1,display:"flex",overflow:"hidden"}}><TestTab/></div>)}

      </div>
    </div>
  );
}