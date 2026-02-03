import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  ExternalLink, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  BookOpen, 
  Scale, 
  Award, 
  Globe, 
  Settings, 
  Lock, 
  History, 
  FileSearch
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { DocumentType, TaxOption, DocumentState, Item } from './types';
import { formatNumber, numberToKorean, calculateTotals, formatPhoneNumber, formatBizNo } from './utils';

const INITIAL_STATE: DocumentState = {
  type: DocumentType.ESTIMATE,
  docNo: `DOC-${new Date().getTime().toString().slice(-6)}`,
  date: new Date().toISOString().split('T')[0],
  supplier: {
    bizNo: '',
    name: '',
    owner: '',
    address: '',
    bizType: '',
    bizItem: '',
    contact: ''
  },
  client: {
    bizNo: '',
    name: '',
    owner: ''
  },
  items: [
    { id: '1', name: '', spec: '', qty: 0, unitPrice: 0 }
  ],
  taxOption: TaxOption.VAT_EXCLUDED,
  stampUrl: null,
  stampPos: { x: 74, y: 19 },
  stampSize: 60
};

const ITEMS_PER_FIRST_PAGE = 10;
const ITEMS_PER_SUBSEQUENT_PAGE = 22;

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [doc, setDoc] = useState<DocumentState>(INITIAL_STATE);
  const [isExporting, setIsExporting] = useState(false);
  const pagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const draggingRef = useRef(false);
  const introScrollRef = useRef<HTMLDivElement>(null);

  const handleTypeChange = (type: DocumentType) => setDoc(prev => ({ ...prev, type }));
   
  const handleSupplierChange = (field: keyof typeof doc.supplier, value: string) => {
    let formattedValue = value;
    if (field === 'contact') formattedValue = formatPhoneNumber(value);
    if (field === 'bizNo') formattedValue = formatBizNo(value);
    setDoc(prev => ({ ...prev, supplier: { ...prev.supplier, [field]: formattedValue } }));
  };

  const handleClientChange = (field: keyof typeof doc.client, value: string) => {
    let formattedValue = value;
    if (field === 'bizNo') formattedValue = formatBizNo(value);
    setDoc(prev => ({ ...prev, client: { ...prev.client, [field]: formattedValue } }));
  };

  const handleItemChange = (id: string, field: keyof Item, value: any) => {
    setDoc(prev => ({ ...prev, items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item) }));
  };

  const addItem = () => {
    setDoc(prev => ({ ...prev, items: [...prev.items, { id: Date.now().toString(), name: '', spec: '', qty: 0, unitPrice: 0 }] }));
  };

  const removeItem = (id: string) => {
    setDoc(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setDoc(prev => ({ ...prev, stampUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    draggingRef.current = true;
    e.stopPropagation();
  };

  const onDragging = useCallback((e: MouseEvent | TouchEvent) => {
    if (!draggingRef.current || !pagesRef.current[0]) return;
    const rect = pagesRef.current[0].getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setDoc(prev => ({
      ...prev,
      stampPos: {
        x: Number(Math.max(0, Math.min(100, x)).toFixed(2)),
        y: Number(Math.max(0, Math.min(100, y)).toFixed(2))
      }
    }));
  }, []);

  const onDragEnd = () => { draggingRef.current = false; };

  useEffect(() => {
    window.addEventListener('mousemove', onDragging);
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchmove', onDragging, { passive: false });
    window.addEventListener('touchend', onDragEnd);
    return () => {
      window.removeEventListener('mousemove', onDragging);
      window.removeEventListener('mouseup', onDragEnd);
      window.removeEventListener('touchmove', onDragging);
      window.removeEventListener('touchend', onDragEnd);
    };
  }, [onDragging]);

  const exportPDF = async () => {
    const activePages = pagesRef.current.filter(p => p !== null);
    if (activePages.length === 0) return;
    setIsExporting(true);
    
    try {
      await document.fonts.ready;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210; 

      for (let i = 0; i < activePages.length; i++) {
        const page = activePages[i];
        if (!page) continue;

        const canvas = await html2canvas(page, {
          scale: 3, 
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: page.offsetWidth, 
          height: page.offsetHeight
        });

        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
      }
      
      pdf.save(`${doc.type}_${doc.docNo}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert("PDF 변환 중 오류가 발생했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element && introScrollRef.current) {
      const top = element.offsetTop - 100;
      introScrollRef.current.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleCopyEmail = () => {
    const email = 'after.noise.11622@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
      alert(`이메일 주소가 복사되었습니다: ${email}`);
    });
  };

  const { subTotal, vat, total } = calculateTotals(doc.items, doc.taxOption);
  const inputBaseClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black font-medium block transition-shadow";
  const itemInputClass = "w-full bg-white border-b border-gray-300 text-sm py-1 px-1 focus:border-blue-500 outline-none text-black font-medium";
  const labelCellClass = "border border-gray-900 bg-gray-50 px-3 py-2 text-center font-bold text-gray-800 align-middle whitespace-nowrap text-sm";
  const valueCellClass = "border border-gray-900 px-3 py-2 text-gray-900 font-medium align-middle text-sm break-all leading-tight";

  const getPageChunks = () => {
    const chunks: Item[][] = [];
    let currentIdx = 0;
    chunks.push(doc.items.slice(0, ITEMS_PER_FIRST_PAGE));
    currentIdx = ITEMS_PER_FIRST_PAGE;
    while (currentIdx < doc.items.length) {
      chunks.push(doc.items.slice(currentIdx, currentIdx + ITEMS_PER_SUBSEQUENT_PAGE));
      currentIdx += ITEMS_PER_SUBSEQUENT_PAGE;
    }
    return chunks;
  };

  const pageChunks = getPageChunks();

  if (showIntro) {
    return (
      <div ref={introScrollRef} className="h-screen bg-white flex flex-col scroll-smooth overflow-y-auto overflow-x-hidden relative">
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-6 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2 font-black text-2xl text-blue-600 tracking-tighter cursor-pointer" onClick={() => introScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}>
              <FileText size={32} className="text-blue-500" />
              QuickBiz <span className="text-slate-300 font-light">Pro</span>
            </div>
            <div className="hidden md:flex items-center gap-10 text-[14px] font-bold text-slate-600">
              <button onClick={() => scrollToSection('features')} className="hover:text-blue-600 transition-colors">주요기능</button>
              <button onClick={() => scrollToSection('guide')} className="hover:text-blue-600 transition-colors">이용가이드</button>
              <button onClick={() => scrollToSection('knowledge')} className="hover:text-blue-600 transition-colors">비즈니스지식</button>
              <button onClick={() => scrollToSection('faq')} className="hover:text-blue-600 transition-colors">자주 묻는 질문</button>
              <button 
                onClick={() => setShowIntro(false)}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
              >
                무료로 시작하기
              </button>
            </div>
          </div>
        </nav>

        <section id="hero" className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 pt-20 pb-36 px-6 relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-96 h-96 bg-white rounded-full blur-[120px]"></div>
            <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-indigo-400 rounded-full blur-[150px]"></div>
          </div>
           
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
            <div className="space-y-7 animate-in fade-in slide-in-from-left duration-700">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-50 text-[10px] font-black backdrop-blur-md">
                <Globe size={10} className="animate-pulse" />
                QUICKBIZ PRO BUSINESS AUTOMATION
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                <span className="block mb-4">견적서, 명세서, 영수증,</span>
                <span className="block">
                  <span className="text-blue-200 italic">인감까지</span> 한번에!
                </span>
              </h1>
              <div className="space-y-4">
                <p className="text-sm md:text-base text-blue-50/90 leading-relaxed max-w-lg font-bold">
                  프리랜서, 1인 기업가, 소상공인을 위한 대한민국 최고의 스마트 문서 솔루션. 
                  가장 완벽한 서류들을 지금 바로 브라우저에서 무료로 발행하세요.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-blue-100 font-bold text-[11px]">
                  <span className="flex items-center gap-1.5 bg-blue-500/30 px-2.5 py-1 rounded-lg border border-white/10"><Lock size={12}/> 보안 서버 미저장</span>
                  <span className="flex items-center gap-1.5 bg-blue-500/30 px-2.5 py-1 rounded-lg border border-white/10"><CheckCircle size={12}/> A4 규격 최적화</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button 
                  onClick={() => setShowIntro(false)}
                  className="group flex items-center justify-center gap-2 bg-white text-blue-800 hover:bg-slate-50 px-7 py-3.5 rounded-xl text-base font-black transition-all shadow-xl active:scale-95"
                >
                  지금 바로 만들기
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => scrollToSection('guide')}
                  className="flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-white px-7 py-3.5 rounded-xl text-sm font-black border border-white/20 backdrop-blur-sm transition-all"
                >
                  상세 가이드 보기
                </button>
              </div>
            </div>

            <div className="hidden lg:block relative animate-in fade-in slide-in-from-right duration-1000">
              <div className="relative bg-white p-8 md:p-12 rounded-[40px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] border border-white/30 rotate-1 group hover:rotate-0 transition-all duration-700">
                <div className="space-y-8">
                   <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                      <div className="space-y-2.5">
                        <div className="h-6 w-32 bg-slate-100 rounded-lg"></div>
                        <div className="h-3 w-24 bg-slate-50 rounded-md"></div>
                      </div>
                      <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-300 transform group-hover:scale-110 transition-transform">
                        <FileSearch size={24} />
                      </div>
                   </div>
                   <div className="space-y-6 pb-12">
                      <div className="h-3 w-full bg-slate-50 rounded-md"></div>
                      <div className="h-3 w-full bg-slate-50 rounded-md"></div>
                      <div className="h-3 w-2/3 bg-slate-50 rounded-md"></div>
                   </div>
                   <div className="flex justify-end pt-8 relative border-t border-slate-100">
                      <div className="absolute -top-6 right-12 text-[9px] text-slate-300 font-bold italic">Drag stamp anywhere</div>
                      <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-100 flex items-center justify-center relative overflow-hidden bg-slate-50">
                        <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center text-red-600 font-black text-xl shadow-inner animate-pulse">印</div>
                      </div>
                   </div>
                </div>
              </div>
              <div className="absolute -top-8 -right-4 w-28 h-28 bg-yellow-400 rounded-[24px] shadow-2xl flex flex-col items-center justify-center text-yellow-900 rotate-12 border-4 border-white/40">
                <span className="text-[8px] font-black opacity-40 uppercase">Certified</span>
                <span className="text-xl font-black">PRO</span>
                <Award size={20} className="mt-1 text-yellow-600" />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 space-y-3">
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-widest border border-blue-100">Powerful Engine</span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">비즈니스 효율을 극대화하는 기능</h2>
              <p className="text-slate-500 text-base font-bold max-w-xl mx-auto">엑셀 설치 없이도 완벽한 고품질 문서를 발행할 수 있습니다.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: <Zap size={24} className="text-blue-500" />, title: "지능형 자동 산출", desc: "단가와 수량만 입력하면 모든 세무 금액이 실시간으로 완벽하게 산출됩니다." },
                { icon: <ArrowRight size={24} className="text-emerald-500" />, title: "한글 금액 변환", desc: "숫자 금액을 '일금 삼백만원정'과 같은 표준 한글 표기로 자동 변환합니다." },
                { icon: <ShieldCheck size={24} className="text-indigo-500" />, title: "데이터 보안 강화", desc: "서버 저장 없이 브라우저 메모리 내에서만 작동하여 유출 걱정이 없습니다." },
                { icon: <FileText size={24} className="text-orange-500" />, title: "다중 페이지 지원", desc: "품목이 많아져도 자동으로 페이지가 분할되어 깔끔한 문서를 생성합니다." }
              ].map((f, i) => (
                <div key={i} className="group p-8 bg-slate-50/50 border border-slate-100 rounded-[32px] shadow-sm hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5 text-center">
                  <div className="mb-6 w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform mx-auto">{f.icon}</div>
                  <h4 className="text-lg font-black mb-3 text-slate-900">{f.title}</h4>
                  <p className="text-slate-500 text-xs leading-relaxed font-bold break-keep">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="knowledge" className="py-24 px-6 bg-slate-900 text-white relative">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/5 -skew-x-12 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div className="space-y-10">
                <div className="space-y-4">
                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest border border-blue-500/30">Business Intelligence</span>
                  <h2 className="text-2xl md:text-4xl font-black leading-tight tracking-tight">전문적인 비즈니스<br/><span className="text-blue-400">문서 작성 상식</span></h2>
                  <p className="text-slate-400 text-base leading-relaxed font-bold">
                    신뢰받는 파트너가 되기 위한<br/>서류 작성 노하우를 확인하세요.
                  </p>
                </div>
                 
                <div className="space-y-7">
                  {[
                    { icon: <Scale />, title: "견적서의 효력", desc: "견적서는 계약 체결 전의 청약 유인입니다. 상대방이 승낙하고 서명할 경우 계약서와 동일한 효력을 가질 수 있으니 신중히 작성하세요." },
                    { icon: <History />, title: "증빙 보관 규정", desc: "국세청은 거래 증빙 서류를 5년간 보관할 것을 권장합니다. QuickBiz Pro에서 발행한 PDF를 클라우드에 안전하게 백업해두세요." },
                    { icon: <Settings />, title: "부가세 신고 기초", desc: "일반과세자는 10% 부가세를 별도 표시하며, 간이과세자는 합계 금액 위주로 작성합니다. 본인의 사업자 유형을 확인하세요." }
                  ].map((tip, i) => (
                    <div key={i} className="flex gap-5 items-start group">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                        {React.cloneElement(tip.icon as React.ReactElement, { size: 24 })}
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-lg font-black text-white">{tip.title}</h4>
                        <p className="text-slate-400 text-xs leading-relaxed font-bold break-keep">{tip.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-2xl p-8 md:p-10 rounded-[40px] border border-white/10 space-y-8 shadow-2xl mb-10 lg:mb-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-xl">
                    <BookOpen size={20} />
                  </div>
                  <h3 className="text-xl font-black">비즈니스 용어 가이드</h3>
                </div>
                <div className="grid gap-6">
                  {[
                    { t: "공급가액 vs 합계금액", d: "공급가액은 물건값 자체이며, 합계금액은 여기에 부가세 10%를 더한 최종 결제액입니다." },
                    { t: "단가 (Unit Price)", d: "물품 한 단위당 가격입니다. 수량을 곱해 자동으로 행별 소계가 산출됩니다." },
                    { t: "원정 (元正)", d: "금액 변조 방지를 위해 숫자 뒤에 붙이는 한자어입니다. '오직 이 금액뿐이다'라는 의미입니다." },
                    { t: "특약사항 (Remark)", d: "납기나 AS 조건 등 예외 사항을 기재하는 영역으로 분쟁 예방에 핵심적인 역할을 합니다." }
                  ].map((word, i) => (
                    <div key={i} className="space-y-1.5 group">
                      <span className="text-blue-400 font-black text-base block group-hover:text-blue-200 transition-colors tracking-tight">{word.t}</span>
                      <p className="text-slate-400 text-xs font-bold leading-relaxed break-keep">{word.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="py-24 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16 space-y-3">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">자주 묻는 질문</h2>
              <p className="text-slate-500 text-base font-bold">QuickBiz Pro 이용에 대해 궁금하신 점을 해결해 드립니다.</p>
            </div>
            <div className="space-y-3.5">
              {[
                { q: "회원가입이 왜 필요 없나요?", a: "QuickBiz Pro의 철학은 즉각적인 업무 지원입니다. 번거로운 절차 없이 바로 이용할 수 있도록 했으며, 모든 데이터는 브라우저 캐시에만 안전하게 유지됩니다." },
                { q: "도장 배경을 지울 수 있나요?", a: "네, 입력 폼 하단의 도장 배경 제거 배너를 클릭하시면 AI 도구로 연결됩니다. 배경이 없는 투명 PNG를 사용하시면 훨씬 깔끔하게 발급됩니다." },
                { q: "발행 문서의 법적 효력은?", a: "대한민국 표준 양식을 따르고 있어 민간 거래 증빙용으로 충분히 활용 가능합니다. 다만 정식 세금계산서는 홈택스를 이용하셔야 합니다." }
              ].map((item, i) => (
                <details key={i} className="group bg-slate-50 rounded-[24px] p-6 border border-slate-100 cursor-pointer hover:bg-white hover:shadow-lg transition-all duration-300">
                  <summary className="font-black text-base flex justify-between items-center list-none text-slate-900 tracking-tight">
                    {item.q}
                    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-slate-400 group-open:rotate-180 transition-transform shadow-sm">
                      <Plus size={14} />
                    </div>
                  </summary>
                  <p className="mt-5 text-slate-600 leading-relaxed font-bold border-t border-slate-200 pt-5 text-sm break-keep">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto bg-blue-600 rounded-[56px] p-12 md:p-20 text-center space-y-8 relative overflow-hidden shadow-2xl shadow-blue-200">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.25),transparent)]"></div>
            <div className="relative z-10 space-y-4">
              <h2 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tighter">비즈니스의 품격을<br/>지금 바로 높여보세요.</h2>
              <p className="text-blue-100 text-base md:text-lg font-bold opacity-90">100% 무료 발급 • 무제한 사용 • 보안 보장</p>
            </div>
            <div className="relative z-10 flex justify-center pt-2">
              <button 
                onClick={() => setShowIntro(false)}
                className="group bg-white text-blue-600 px-10 py-5 rounded-[24px] text-xl font-black shadow-2xl hover:scale-105 transition-all active:scale-95 flex items-center gap-3"
              >
                무료 시작하기
                <ArrowRight size={24} className="group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </div>
        </section>

        <footer className="bg-slate-50 text-slate-500 py-24 px-6 border-t border-slate-200">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-16">
            <div className="col-span-2 space-y-8">
              <div className="flex items-center gap-2 font-black text-2xl text-slate-900">
                <FileText size={28} className="text-blue-600" />
                QuickBiz Pro
              </div>
              <p className="max-w-md text-[13px] leading-relaxed font-bold">
                퀵비즈 프로(QuickBiz Pro)는 루소프트웨어(LuSoftware)가 출시한 소상공인과 프리랜서들의 행정 효율화를 위한 클라우드 기반 문서 자동화 서비스입니다. 
                사용자의 개인정보 보호를 최우선으로 하며, 신속하고 정확한 비즈니스 문서 발급을 지원합니다.
              </p>
              <div className="flex gap-4">
                <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:text-blue-600 transition-colors cursor-pointer shadow-sm"><Globe size={18}/></div>
                <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:text-blue-600 transition-colors cursor-pointer shadow-sm"><Award size={18}/></div>
                <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:text-blue-600 transition-colors cursor-pointer shadow-sm"><Lock size={18}/></div>
              </div>
            </div>
            <div className="space-y-5">
              <h5 className="text-slate-900 font-black uppercase tracking-widest text-[9px]">Product</h5>
              <ul className="space-y-2.5 font-bold text-xs">
                <li><button onClick={() => scrollToSection('features')} className="hover:text-blue-600">핵심 기능</button></li>
                <li><button onClick={() => scrollToSection('guide')} className="hover:text-blue-600">이용 가이드</button></li>
                <li><button onClick={() => scrollToSection('knowledge')} className="hover:text-blue-600">비즈니스 전문지식</button></li>
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-blue-600">자주 묻는 질문</button></li>
              </ul>
            </div>
            <div className="space-y-5">
              <h5 className="text-slate-900 font-black uppercase tracking-widest text-[9px]">Legal</h5>
              <ul className="space-y-2.5 font-bold text-xs">
                <li className="hover:text-blue-600 cursor-pointer">이용약관</li>
                <li className="hover:text-blue-600 cursor-pointer">개인정보처리방침</li>
                <li 
                  className="hover:text-blue-600 cursor-pointer"
                  onClick={handleCopyEmail}
                >
                  광고 제휴 문의
                </li>
                <li className="hover:text-blue-600 cursor-pointer">기술 지원</li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto border-t border-slate-200 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-bold">
            <p>&copy; 2025 LuSoftware Inc. QuickBiz Pro Service. All Rights Reserved.</p>
            <div className="flex gap-8">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14}/> 256-bit AES Encryption</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={14}/> v2.8.5 Stable</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row text-gray-900 font-sans h-screen overflow-hidden">
       
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');
        .preview-content { font-family: 'Noto Sans KR', sans-serif; }
        .stamp-draggable { cursor: move; touch-action: none; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* 왼쪽 입력 폼 */}
      <div className="w-full md:w-[400px] lg:w-[450px] bg-white border-r border-gray-200 h-full overflow-y-auto p-6 space-y-8 no-print shrink-0 shadow-lg z-10 flex flex-col">
        <header className="flex items-center justify-between shrink-0 mb-4">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => setShowIntro(true)}>
            <FileText size={24} />
            QuickBiz Pro
          </h1>
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            {(Object.keys(DocumentType) as Array<keyof typeof DocumentType>).map((key) => (
              <button
                key={key}
                onClick={() => handleTypeChange(DocumentType[key])}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  doc.type === DocumentType[key] 
                    ? 'bg-white text-blue-600 shadow-sm border border-gray-100' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {key === 'ESTIMATE' ? '견적서' : key === 'TRANSACTION_STATEMENT' ? '명세서' : '영수증'}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 space-y-8 pb-4">
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
              <Zap size={14} className="text-blue-500" />
              기본 및 공급자 정보
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-tighter">문서 번호</label>
                <input value={doc.docNo} onChange={(e) => setDoc(p => ({ ...p, docNo: e.target.value }))} className={inputBaseClass} />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-tighter">날짜</label>
                <input type="date" value={doc.date} onChange={(e) => setDoc(p => ({ ...p, date: e.target.value }))} className={inputBaseClass} />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-tighter">상호 / 법인명</label>
                <input placeholder="예: (주)비즈니스솔루션" value={doc.supplier.name} onChange={(e) => handleSupplierChange('name', e.target.value)} className={inputBaseClass} />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-tighter">등록번호</label>
                <input placeholder="000-00-00000" value={doc.supplier.bizNo} onChange={(e) => handleSupplierChange('bizNo', e.target.value)} className={inputBaseClass} />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-tighter">대표자명</label>
                <input placeholder="홍길동" value={doc.supplier.owner} onChange={(e) => handleSupplierChange('owner', e.target.value)} className={inputBaseClass} />
              </div>
              {/* 추가된 부분 */}
              <div className="col-span-2">
                <label className="block text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-tighter">사업장 주소</label>
                <input placeholder="서울시 강남구..." value={doc.supplier.address} onChange={(e) => handleSupplierChange('address', e.target.value)} className={inputBaseClass} />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-tighter">업태</label>
                <input placeholder="서비스" value={doc.supplier.bizType} onChange={(e) => handleSupplierChange('bizType', e.target.value)} className={inputBaseClass} />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-tighter">종목</label>
                <input placeholder="소프트웨어개발" value={doc.supplier.bizItem} onChange={(e) => handleSupplierChange('bizItem', e.target.value)} className={inputBaseClass} />
              </div>
              {/* 추가된 부분 끝 */}
              <div className="col-span-2">
                <label className="block text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-tighter">연락처</label>
                <input placeholder="010-0000-0000" value={doc.supplier.contact} onChange={(e) => handleSupplierChange('contact', e.target.value)} className={inputBaseClass} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
              <ShieldCheck size={14} className="text-blue-500" />
              공급받는 자 (거래처)
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] text-gray-500 mb-1 font-bold uppercase tracking-tighter">거래처명 / 귀하</label>
                <input placeholder="거래처 이름을 입력하세요" value={doc.client.name} onChange={(e) => setDoc(p => ({ ...p, client: { ...p.client, name: e.target.value } }))} className={inputBaseClass} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Plus size={14} className="text-blue-500" />
                품목 리스트 ({doc.items.length})
              </h2>
              <label className="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer font-bold uppercase tracking-tighter">
                <input type="checkbox" checked={doc.taxOption === TaxOption.VAT_INCLUDED} onChange={(e) => setDoc(p => ({ ...p, taxOption: e.target.checked ? TaxOption.VAT_INCLUDED : TaxOption.VAT_EXCLUDED }))} className="accent-blue-600 w-3 h-3" />
                부가세 포함
              </label>
            </div>
            <div className="space-y-4 pt-2">
              {doc.items.map((item, index) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 relative group shadow-sm transition-all hover:border-blue-200">
                  <div className="absolute -left-2 -top-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-sm z-10 border border-white">
                    {index + 1}
                  </div>
                  <button onClick={() => removeItem(item.id)} className="absolute -right-2 -top-2 bg-white border border-red-200 text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 shadow-md z-10"><Trash2 size={14} /></button>
                  <div className="grid grid-cols-12 gap-3 pl-1">
                    <div className="col-span-7"><label className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">품목명</label><input value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} className={itemInputClass} /></div>
                    <div className="col-span-5"><label className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">규격</label><input value={item.spec} onChange={(e) => handleItemChange(item.id, 'spec', e.target.value)} className={itemInputClass} /></div>
                    <div className="col-span-3"><label className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">수량</label><input type="number" value={item.qty || ''} onChange={(e) => handleItemChange(item.id, 'qty', parseInt(e.target.value) || 0)} className={itemInputClass} /></div>
                    <div className="col-span-5"><label className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">단가</label><input type="number" value={item.unitPrice || ''} onChange={(e) => handleItemChange(item.id, 'unitPrice', parseInt(e.target.value) || 0)} className={itemInputClass} /></div>
                    <div className="col-span-4 flex items-end justify-end"><span className="text-xs font-bold text-gray-800">₩{formatNumber(item.qty * item.unitPrice)}</span></div>
                  </div>
                </div>
              ))}
              <button onClick={addItem} className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 text-xs bg-white font-bold"><Plus size={14} /> 품목 추가</button>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-2 flex items-center gap-2">
              <ImageIcon size={14} className="text-blue-500" />
              도장(인감) 및 마감 설정
            </h2>
             
            <a 
              href="https://stamp-remover.vercel.app" 
              target="_blank" 
              className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded-xl group hover:shadow-lg transition-all shadow-md overflow-hidden relative"
            >
              <div className="relative z-10 flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <Sparkles className="text-white" size={18} />
                </div>
                <div>
                  <div className="text-[12px] font-black text-white leading-tight">Pro Tip: 도장 배경 제거</div>
                  <div className="text-[10px] font-bold text-blue-100">AI로 5초 만에 투명한 도장 만들기</div>
                </div>
              </div>
              <div className="relative z-10 bg-white/20 text-white p-1.5 rounded-lg group-hover:bg-white group-hover:text-blue-600 transition-all">
                <ExternalLink size={14} />
              </div>
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            </a>

            <div className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm">
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 relative overflow-hidden bg-white cursor-pointer shadow-inner shrink-0" onClick={() => document.getElementById('stamp-input')?.click()}>
                {doc.stampUrl ? <img src={doc.stampUrl} className="w-full h-full object-contain" alt="Selected Stamp" /> : <><ImageIcon size={24} /><span className="text-[10px] mt-1 font-bold uppercase tracking-tighter">Upload</span></>}
                <input id="stamp-input" type="file" className="hidden" accept="image/*" onChange={handleStampUpload} />
              </div>
              <div className="flex-1 space-y-3">
                <label className="text-[10px] text-gray-500 flex justify-between font-bold uppercase tracking-tighter">Size <span>{doc.stampSize}px</span></label>
                <input type="range" min="30" max="250" value={doc.stampSize} onChange={(e) => setDoc(p => ({ ...p, stampSize: parseInt(e.target.value) }))} className="w-full h-1.5 bg-gray-200 rounded-lg cursor-pointer accent-blue-600" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">X Pos (%)</label>
                    <input type="number" step="0.1" value={doc.stampPos.x} onChange={(e) => setDoc(p => ({ ...p, stampPos: { ...p.stampPos, x: parseFloat(e.target.value) || 0 } }))} className="w-full px-2 py-1 text-xs border border-gray-300 rounded font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Y Pos (%)</label>
                    <input type="number" step="0.1" value={doc.stampPos.y} onChange={(e) => setDoc(p => ({ ...p, stampPos: { ...p.stampPos, y: parseFloat(e.target.value) || 0 } }))} className="w-full px-2 py-1 text-xs border border-gray-300 rounded font-bold" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="shrink-0 bg-white pt-4 pb-2 border-t border-gray-200 mt-auto space-y-3">
          <button onClick={exportPDF} disabled={isExporting} className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-black shadow-xl bg-blue-600 text-white hover:bg-blue-700 transition-all active:scale-95 disabled:bg-gray-400 disabled:shadow-none tracking-tight">
            {isExporting ? 'Creating PDF...' : <><Download size={20} /> PDF 다운로드</>}
          </button>
        </div>
      </div>

      {/* 오른쪽 프리뷰 */}
      <main className="flex-1 bg-slate-800 overflow-auto flex flex-col items-center preview-content select-none relative h-full py-16 gap-10">
        {pageChunks.map((chunk, pageIndex) => (
          <div 
            key={pageIndex}
            ref={el => { pagesRef.current[pageIndex] = el; }}
            className="bg-white shadow-2xl relative overflow-hidden shrink-0" 
            style={{ width: '210mm', height: '297mm', padding: '15mm', boxSizing: 'border-box' }}
          >
            {pageIndex === 0 && doc.stampUrl && (
              <div 
                onMouseDown={onDragStart} 
                onTouchStart={onDragStart}
                className="absolute z-50 stamp-draggable mix-blend-multiply" 
                style={{ 
                  left: `${doc.stampPos.x}%`, 
                  top: `${doc.stampPos.y}%`, 
                  width: `${doc.stampSize}px`, 
                  transform: 'translate(-50%, -50%)', 
                  opacity: 0.85 
                }}
              >
                <img src={doc.stampUrl} className="w-full h-full object-contain pointer-events-none" alt="Seal" />
              </div>
            )}

            {pageIndex === 0 ? (
              <>
                <div className="relative mb-12 flex justify-center pt-4">
                  <h1 className="text-4xl font-black tracking-[0.5em] text-gray-900 border-b-4 border-double border-gray-900 px-12 pb-6">
                    {doc.type === DocumentType.ESTIMATE ? '견 적 서' : doc.type === DocumentType.TRANSACTION_STATEMENT ? '거래명세서' : '영 수 증'}
                  </h1>
                </div>
                <div className="flex gap-6 mb-10 items-stretch">
                  <div className="flex-1 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex border-b border-gray-400 pb-2 px-1 items-center justify-between">
                          <span className="text-sm font-bold text-gray-600">작성일자</span>
                          <span className="text-base text-gray-900 font-bold">{doc.date}</span>
                      </div>
                      <div className="flex border-b border-gray-400 pb-2 px-1 items-center justify-between">
                          <span className="text-sm font-bold text-gray-600">문서번호</span>
                          <span className="text-base text-gray-900 font-bold">{doc.docNo}</span>
                      </div>
                    </div>
                    <div className="border-2 border-gray-900 p-6 flex-1 flex flex-col justify-center bg-white rounded-sm">
                      <div className="text-2xl mb-4 text-gray-900 flex items-baseline gap-2 border-b-2 border-gray-300 pb-4">
                          <span className="font-black text-3xl">{doc.client.name || '(거래처명)'}</span>
                          <span className="text-xl font-bold text-gray-600">귀하</span>
                      </div>
                      <div className="text-base text-gray-600 font-medium leading-relaxed">
                          아래와 같이 {doc.type === DocumentType.ESTIMATE ? '견적' : '거래'} 내용을 확인합니다.<br/>
                          항상 저희 서비스를 이용해 주셔서 감사합니다.
                      </div>
                    </div>
                  </div>
                  <div className="w-[380px]">
                    <table className="w-full h-full border-collapse border border-gray-900 shadow-sm">
                      <tbody>
                        <tr>
                          <td rowSpan={6} className="w-8 border border-gray-900 bg-gray-100 text-center font-bold p-1 text-gray-800 align-middle leading-loose text-sm">공<br/>급<br/>자</td>
                          <td className={labelCellClass}>등록번호</td>
                          <td colSpan={3} className={valueCellClass}>{doc.supplier.bizNo || ''}</td>
                        </tr>
                        <tr>
                          <td className={labelCellClass}>상 호</td>
                          <td className={valueCellClass}>{doc.supplier.name || ''}</td>
                          <td className={labelCellClass}>성 명</td>
                          <td className="border border-gray-900 px-3 py-2 relative text-gray-900 font-medium align-middle text-sm">
                            <div className="flex justify-between items-center w-full z-0">
                              <span>{doc.supplier.owner || ''}</span>
                              <span className="text-gray-400 font-bold text-xs">(인)</span>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className={labelCellClass}>주 소</td>
                          <td colSpan={3} className={`${valueCellClass}`}>{doc.supplier.address || ''}</td>
                        </tr>
                        <tr>
                          <td className={labelCellClass}>업 태</td>
                          <td className={valueCellClass}>{doc.supplier.bizType}</td>
                          <td className={labelCellClass}>종 목</td>
                          <td className={valueCellClass}>{doc.supplier.bizItem}</td>
                        </tr>
                        <tr>
                          <td className={labelCellClass}>연락처</td>
                          <td colSpan={3} className={valueCellClass}>{doc.supplier.contact || ''}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="border-t-2 border-b-2 border-gray-900 mb-8 py-4 px-6 flex justify-between items-center bg-gray-50">
                  <span className="font-bold text-xl text-gray-800">합계금액</span>
                  <div className="text-right flex items-baseline gap-4">
                      <span className="text-base font-bold text-gray-600">({numberToKorean(total)})</span>
                      <span className="text-3xl font-black text-gray-900">₩ {formatNumber(total)}</span>
                      <span className="text-xs text-gray-500 font-bold self-center bg-gray-200 px-2 py-1 rounded">(VAT {doc.taxOption === TaxOption.VAT_INCLUDED ? '포함' : '별도'})</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="mb-6 flex justify-between items-end border-b-2 border-gray-900 pb-2">
                <span className="text-xl font-black">{doc.type} (계속)</span>
                <span className="text-sm font-bold text-gray-500">페이지 {pageIndex + 1} / {pageChunks.length}</span>
              </div>
            )}

            <table className="w-full border-collapse border border-gray-900 text-sm mb-12">
              <thead>
                  <tr className="bg-gray-100 text-gray-800 font-bold h-12">
                      <th className="border border-gray-900 px-2 w-12 text-center align-middle">NO</th>
                      <th className="border border-gray-900 px-4 text-center align-middle">품목명</th>
                      <th className="border border-gray-900 px-2 w-20 text-center align-middle">규격</th>
                      <th className="border border-gray-900 px-2 w-16 text-center align-middle">수량</th>
                      <th className="border border-gray-900 px-4 w-32 text-center align-middle">단가</th>
                      <th className="border border-gray-900 px-4 w-40 text-center align-middle">공급가액</th>
                  </tr>
              </thead>
              <tbody>
                {chunk.map((item, idx) => {
                  const globalIdx = pageIndex === 0 
                    ? idx + 1 
                    : ITEMS_PER_FIRST_PAGE + (pageIndex - 1) * ITEMS_PER_SUBSEQUENT_PAGE + idx + 1;
                  return (
                    <tr key={item.id} className="h-12 text-gray-900 hover:bg-gray-50">
                      <td className="border border-gray-900 px-2 text-center font-bold align-middle text-gray-600">{globalIdx}</td>
                      <td className="border border-gray-900 px-4 font-medium align-middle text-left">{item.name}</td>
                      <td className="border border-gray-900 px-2 text-center align-middle text-gray-600">{item.spec}</td>
                      <td className="border border-gray-900 px-2 text-right align-middle">{item.qty || ''}</td>
                      <td className="border border-gray-900 px-4 text-right align-middle">{item.unitPrice ? formatNumber(item.unitPrice) : ''}</td>
                      <td className="border border-gray-900 px-4 text-right font-bold align-middle">{item.qty && item.unitPrice ? formatNumber(item.qty * item.unitPrice) : ''}</td>
                    </tr>
                  );
                })}
                {Array.from({ 
                  length: Math.max(0, (pageIndex === 0 ? ITEMS_PER_FIRST_PAGE : ITEMS_PER_SUBSEQUENT_PAGE) - chunk.length) 
                }).map((_, i) => (
                    <tr key={`filler-${i}`} className="h-12">
                      <td className="border border-gray-900 px-2"></td>
                      <td className="border border-gray-900 px-4"></td>
                      <td className="border border-gray-900 px-2"></td>
                      <td className="border border-gray-900 px-2"></td>
                      <td className="border border-gray-900 px-4"></td>
                      <td className="border border-gray-900 px-4"></td>
                    </tr>
                ))}
              </tbody>
              {pageIndex === pageChunks.length - 1 && (
                <tfoot>
                  <tr className="bg-gray-50 h-10 font-bold text-gray-800">
                      <td colSpan={3} className="border border-gray-900 px-4 text-center align-middle">소 계</td>
                      <td colSpan={3} className="border border-gray-900 px-4 text-right align-middle">{formatNumber(subTotal)}</td>
                  </tr>
                  <tr className="bg-gray-50 h-10 font-bold text-gray-800">
                      <td colSpan={3} className="border border-gray-900 px-4 text-center align-middle">부 가 세 (10%)</td>
                      <td colSpan={3} className="border border-gray-900 px-4 text-right align-middle">{formatNumber(vat)}</td>
                  </tr>
                  <tr className="bg-gray-100 h-14 text-gray-900 font-black border-t-2 border-gray-900">
                      <td colSpan={3} className="border border-gray-900 px-4 text-center align-middle text-lg">합 계 (TOTAL)</td>
                      <td colSpan={3} className="border border-gray-900 px-4 text-right align-middle text-2xl">₩ {formatNumber(total)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
            {pageIndex === pageChunks.length - 1 && (
              <div className="border border-gray-300 p-6 text-sm text-gray-600 leading-relaxed bg-gray-50 rounded shadow-sm">
                <span className="font-bold text-gray-800 block mb-2 text-base">[참고사항]</span>
                <ul className="list-disc pl-5 space-y-1">
                    <li>본 문서는 법적 효력을 보장하지 않으며 거래 증빙용으로 활용하십시오.</li>
                    <li>위 금액에는 부가가치세가 {doc.taxOption === TaxOption.VAT_INCLUDED ? '포함되어 있습니다.' : '별도로 부과됩니다.'}</li>
                    <li>입금계좌: __________________________________________________________________</li>
                </ul>
              </div>
            )}
            <div className="absolute bottom-6 left-0 w-full text-center text-xs text-gray-400 font-bold">
              - {pageIndex + 1} -
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
