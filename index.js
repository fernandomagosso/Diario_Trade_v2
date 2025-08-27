import React, { useState, useMemo, useRef, useCallback, useEffect } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client';

// --- TRANSLATIONS ---
const translations = {
  en: {
    title: "REG Trade Journal",
    toggleLang: "Mudar para Português",
    newOperation: "New Operation",
    updateOperation: "Update Operation",
    asset: "Asset (e.g., WINFUT)",
    opNumber: "Operation No.",
    side: "Side",
    buy: "Buy",
    sell: "Sell",
    date: "Date",
    lots: "Lots (Qty)",
    entryPrice: "Entry Price",
    exitPrice: "Exit Price",
    pointValue: "Value per Point",
    region: "Region",
    addNewRegion: "Enter new region",
    structure: "Structure (A-B-C)",
    trigger: "Trigger",
    addNewTrigger: "Enter new trigger",
    addOperation: "Add Operation",
    cancelEdit: "Cancel",
    dashboard: "Dashboard",
    regAnalysis: "REG Analysis",
    triggerPerformance: "Performance by Trigger",
    regionPerformance: "Performance by Region",
    performanceBySide: "Performance by Side",
    winRate: "Win Rate",
    netResult: "Net Result",
    totalPoints: "Total Points",
    totalOps: "Total Operations",
    totalLots: "Total Lots",
    cumulativeResult: "Cumulative Result",
    operationsLog: "Operations Log",
    exportCSV: "Export to CSV",
    importCSV: "Import CSV",
    breakEven: "Break-even",
    filters: { all: "All", today: "Today", week: "This Week", month: "This Month" },
    table: { op: "Op#", asset: "Asset", date: "Date", side: "Side", lots: "Lots", entry: "Entry", exit: "Exit", points: "Points", result: "Result", status: "Status", reg: "R-E-G", actions: "Actions", edit: "Edit", delete: "Delete" },
    deleteConfirmTitle: "Confirm Deletion",
    deleteConfirmMessage: "Are you sure you want to permanently delete operation #{opNumber} ({asset})?",
    confirm: "Confirm",
    cancel: "Cancel",
    noData: "No operations recorded for the selected period. Add one or change the filter.",
    noChartData: "Not enough data to display charts.",
    importSuccess: "Successfully imported {count} operations.",
    importErrorDetail: "Error importing file: {error}",
    aiCoach: { title: "AI Coach Analysis", loading: "Analyzing your trade...", close: "Close" },
  },
  pt: {
    title: "Diário de Trades REG",
    toggleLang: "Switch to English",
    newOperation: "Nova Operação",
    updateOperation: "Atualizar Operação",
    asset: "Ativo (ex: WDOFUT)",
    opNumber: "Nro. da Operação",
    side: "Lado",
    buy: "Compra",
    sell: "Venda",
    date: "Data",
    lots: "Lotes (Qtd)",
    entryPrice: "Preço de Entrada",
    exitPrice: "Preço de Saída",
    pointValue: "Valor por Ponto",
    region: "Região",
    addNewRegion: "Digite a nova região",
    structure: "Estrutura (A-B-C)",
    trigger: "Gatilho",
    addNewTrigger: "Digite o novo gatilho",
    addOperation: "Adicionar Operação",
    cancelEdit: "Cancelar",
    dashboard: "Painel de Controle",
    regAnalysis: "Análise REG",
    triggerPerformance: "Performance por Gatilho",
    regionPerformance: "Performance por Região",
    performanceBySide: "Performance por Lado",
    winRate: "Taxa de Acerto",
    netResult: "Resultado Líquido",
    totalPoints: "Total de Pontos",
    totalOps: "Total de Operações",
    totalLots: "Total de Lotes",
    cumulativeResult: "Resultado Acumulado",
    operationsLog: "Registro de Operações",
    exportCSV: "Exportar para CSV",
    importCSV: "Importar CSV",
    breakEven: "Zero a Zero",
    filters: { all: "Todos", today: "Hoje", week: "Esta Semana", month: "Este Mês" },
    table: { op: "Op#", asset: "Ativo", date: "Data", side: "Lado", lots: "Lotes", entry: "Entrada", exit: "Saída", points: "Pontos", result: "Resultado", status: "Status", reg: "R-E-G", actions: "Ações", edit: "Editar", delete: "Excluir" },
    deleteConfirmTitle: "Confirmar Exclusão",
    deleteConfirmMessage: "Tem certeza que deseja excluir permanentemente a operação #{opNumber} ({asset})?",
    confirm: "Confirmar",
    cancel: "Cancelar",
    noData: "Nenhuma operação registrada para o período selecionado. Adicione uma ou mude o filtro.",
    noChartData: "Dados insuficientes para exibir gráficos.",
    importSuccess: "Importadas {count} operações com sucesso.",
    importErrorDetail: "Erro ao importar arquivo: {error}",
    aiCoach: { title: "Análise do Coach de IA", loading: "Analisando sua operação...", close: "Fechar" },
  },
};

const initialTriggers = {
    en: ["Lock (High)", "Lock (Low)", "2-2-1", "Hidden Pivot"],
    pt: ["Cadeado (Alta)", "Cadeado (Baixa)", "2-2-1", "Pivot Disfarçado"]
};
const initialRegions = {
    en: ["Cheap", "Expensive", "Consolidation"],
    pt: ["Barata", "Cara", "Consolidação"]
};

const initialFormState = {
    asset: '',
    side: 'Buy',
    date: new Date().toISOString().split('T')[0],
    lots: '1',
    entryPrice: '',
    exitPrice: '',
    pointValue: '10',
    region: initialRegions.pt[0],
    newRegion: '',
    structure: '',
    trigger: initialTriggers.pt[0],
    newTrigger: '',
};

// --- UTILITY FUNCTIONS ---
const parseCurrency = (value) => {
    if (typeof value === 'number') return value;
    let s = String(value).trim();
    if (s === '') return 0;

    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');

    if (lastComma > lastDot) {
        s = s.replace(/\./g, '').replace(',', '.');
    }
    else {
        s = s.replace(/,/g, '');
        const dotCount = (s.match(/\./g) || []).length;
        if (dotCount > 1) {
            s = s.replace(/\./g, '');
        }
    }
    
    const num = parseFloat(s);
    return isNaN(num) ? 0 : num;
};

const formatDateToBR = (dateString) => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};


// --- CHART COMPONENTS ---
const BarChart = ({ data, title, lang, noDataMessage }) => {
    const chartEntries = Object.entries(data);
    if (chartEntries.length === 0) {
        return React.createElement("div", { className: "chart-container" },
            React.createElement("h3", null, title),
            React.createElement("p", { className: "no-data" }, noDataMessage)
        );
    }
    const values = chartEntries.map(([, val]) => val.result);
    const maxAbsValue = Math.max(...values.map(Math.abs), 1);
    return (
        React.createElement("div", { className: "chart-container" },
            React.createElement("h3", null, title),
            React.createElement("div", { className: "chart" },
                chartEntries.map(([label, value]) => {
                    const height = (Math.abs(value.result) / maxAbsValue) * 100;
                    const isGain = value.result > 0;
                    const isLoss = value.result < 0;
                    const currencyFormat = { style: 'currency', currency: 'BRL' };
                    const formattedResult = value.result.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US', currencyFormat);
                    return (
                        React.createElement("div", { key: label, className: "bar-group", title: `${label}: ${formattedResult} (${value.count} ops)` },
                            React.createElement("div", { className: "gain-section" }, isGain && React.createElement("div", { className: "bar bar-gain", style: { height: `${height}%` } })),
                            React.createElement("div", { className: "loss-section" }, isLoss && React.createElement("div", { className: "bar bar-loss", style: { height: `${height}%` } })),
                            React.createElement("span", { className: "bar-label" }, label)
                        )
                    );
                })
            )
        )
    );
};

const LineChart = ({ data, title, noDataMessage }) => {
    if (data.length < 2) {
        return React.createElement("div", { className: "chart-container line-chart-container" },
            React.createElement("h3", null, title),
            React.createElement("p", { className: "no-data" }, noDataMessage)
        );
    }
    
    const padding = { top: 10, right: 10, bottom: 10, left: 10 };
    const svgWidth = 300; 
    const svgHeight = 200;
    const chartWidth = svgWidth - padding.left - padding.right;
    const chartHeight = svgHeight - padding.top - padding.bottom;

    const values = data.map(d => d.value);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const range = max - min === 0 ? 1 : max - min;
    
    const mappedPoints = data.map((d, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - ((d.value - min) / range) * chartHeight;
        return { x, y };
    });

    const linePath = mappedPoints.map(p => `${p.x},${p.y}`).join(' ');
    const areaPath = `${linePath} ${padding.left + chartWidth},${padding.top + chartHeight} ${padding.left},${padding.top + chartHeight}`;
    const zeroLineY = padding.top + chartHeight - ((0 - min) / range) * chartHeight;
    
    return (
        React.createElement("div", { className: "chart-container line-chart-container" },
            React.createElement("h3", null, title),
            React.createElement("div", { className: "line-chart" },
                React.createElement("svg", { viewBox: `0 0 ${svgWidth} ${svgHeight}`, preserveAspectRatio: "xMidYMid meet" },
                    React.createElement("defs", null,
                        React.createElement("linearGradient", { id: "area-gradient", x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
                            React.createElement("stop", { offset: "0%", stopColor: "var(--primary-color)" }),
                            React.createElement("stop", { offset: "100%", stopColor: "var(--primary-color)", stopOpacity: "0" })
                        )
                    ),
                    React.createElement("line", { className: "zero-axis", x1: padding.left, y1: zeroLineY, x2: svgWidth - padding.right, y2: zeroLineY }),
                    React.createElement("polygon", { className: "line-area", points: areaPath }),
                    React.createElement("polyline", { className: "line-path", points: linePath })
                )
            )
        )
    );
}

// --- MODAL COMPONENT ---
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        React.createElement("div", { className: "modal-overlay", onClick: onClose },
            React.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation() },
                React.createElement("div", { className: "modal-header" }, React.createElement("h2", null, title)),
                React.createElement("div", { className: "modal-body" }, children)
            )
        )
    );
};

// --- MAIN APP COMPONENT ---
const App = () => {
  const [language, setLanguage] = useState('pt');
  const [operations, setOperations] = useState([]);
  const [triggers, setTriggers] = useState(initialTriggers.pt);
  const [regions, setRegions] = useState(initialRegions.pt);
  const [formState, setFormState] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [operationToDelete, setOperationToDelete] = useState(null);
  const [aiFeedback, setAiFeedback] = useState({ loading: false, text: '', visible: false });
  const [isAddingRegion, setIsAddingRegion] = useState(false);
  const [isAddingTrigger, setIsAddingTrigger] = useState(false);
  const fileInputRef = useRef(null);
  
  const t = translations[language];
  const apiKey = process.env.API_KEY;
  const aiInstanceRef = useRef(null);
  
  const handleLanguageToggle = () => {
    const newLang = language === 'en' ? 'pt' : 'en';
    setLanguage(newLang);
    const newTriggers = initialTriggers[newLang];
    const newRegions = initialRegions[newLang];
    setTriggers(newTriggers);
    setRegions(newRegions);
    setFormState(prev => ({ ...initialFormState, trigger: newTriggers[0], region: newRegions[0] }));
  };

  const resetForm = () => {
    setFormState({ ...initialFormState, trigger: triggers[0], region: regions[0] });
    setEditingId(null);
    setIsAddingRegion(false);
    setIsAddingTrigger(false);
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  const fetchAIFeedback = useCallback(async (op, dashboard) => {
    if (!apiKey) return;
    setAiFeedback({ loading: true, text: '', visible: true });
    try {
        let ai = aiInstanceRef.current;
        if (!ai) {
            const { GoogleGenAI } = await import("https://esm.sh/@google/genai@0.12.0");
            ai = new GoogleGenAI({ apiKey });
            aiInstanceRef.current = ai;
        }
        
        const systemInstruction = `You are an expert trading coach for day traders using the 'REG' (Region, Structure, Trigger) methodology. Your analysis must be concise, direct, and actionable, under 70 words. Analyze the provided trade and give one piece of constructive feedback. Respond in ${language === 'pt' ? 'Portuguese' : 'English'}.`;
        const prompt = `Analyze my last trade: Asset: ${op.asset}, Side: ${op.side}, Result: ${op.status} (${op.result.toFixed(2)} BRL), Region: ${op.region}, Structure: ${op.structure}, Trigger: ${op.trigger}. My overall win rate is ${dashboard.winRate.toFixed(1)}%.`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { systemInstruction },
        });

        setAiFeedback({ loading: false, text: response.text, visible: true });
    } catch (error) {
        console.error("AI Feedback Error:", error);
        setAiFeedback({ loading: false, text: "Error getting feedback.", visible: true });
    }
  }, [apiKey, language]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const { lots: lotsStr, entryPrice: entryStr, exitPrice: exitStr, pointValue: pvStr } = formState;
    
    const lots = parseInt(lotsStr, 10);
    const entryPrice = parseCurrency(entryStr);
    const exitPrice = parseCurrency(exitStr);
    const pointValue = parseCurrency(pvStr);

    if (isNaN(lots) || isNaN(entryPrice) || isNaN(exitPrice) || isNaN(pointValue) || lots <= 0) return;
    
    let currentTrigger = formState.trigger;
    if (isAddingTrigger && formState.newTrigger.trim() !== '') {
        currentTrigger = formState.newTrigger.trim();
        if (!triggers.includes(currentTrigger)) {
            setTriggers(prev => [...prev, currentTrigger]);
        }
    }
    
    let currentRegion = formState.region;
    if (isAddingRegion && formState.newRegion.trim() !== '') {
        currentRegion = formState.newRegion.trim();
        if (!regions.includes(currentRegion)) {
            setRegions(prev => [...prev, currentRegion]);
        }
    }

    const points = formState.side === 'Buy' ? exitPrice - entryPrice : entryPrice - exitPrice;
    const result = points * lots * pointValue;
    const status = result > 0 ? 'Gain' : result < 0 ? 'Loss' : 'Break-even';

    if(editingId !== null){
        const updatedOp = { id: editingId, asset: formState.asset, opNumber: operations.find(op => op.id === editingId).opNumber, side: formState.side, date: formState.date, lots, entryPrice, exitPrice, points, result, status, region: currentRegion, structure: formState.structure, trigger: currentTrigger };
        setOperations(ops => ops.map(op => op.id === editingId ? updatedOp : op));
    } else {
        const newOp = { id: Date.now(), asset: formState.asset, opNumber: (operations.length > 0 ? Math.max(...operations.map(op => op.opNumber)) : 0) + 1, side: formState.side, date: formState.date, lots, entryPrice, exitPrice, points, result, status, region: currentRegion, structure: formState.structure, trigger: currentTrigger };
        setOperations(prev => [...prev, newOp]);
        fetchAIFeedback(newOp, dashboardData);
    }
    resetForm();
  };

  const handleEdit = (op) => {
    setEditingId(op.id);
    setIsAddingRegion(false);
    setIsAddingTrigger(false);
    const pointValue = op.points !== 0 ? op.result / (op.points * op.lots) : 10;
    setFormState({ asset: op.asset, side: op.side, date: op.date, lots: String(op.lots), entryPrice: String(op.entryPrice), exitPrice: String(op.exitPrice), pointValue: String(pointValue), region: op.region, newRegion: '', structure: op.structure, trigger: op.trigger, newTrigger: '' });
  };
  
  const confirmDelete = () => {
    if (!operationToDelete) return;
    setOperations(prev => prev.filter(op => op.id !== operationToDelete.id).sort((a, b) => a.opNumber - b.opNumber).map((op, idx) => ({ ...op, opNumber: idx + 1 })));
    setOperationToDelete(null);
  };
  
  const filteredOperations = useMemo(() => {
    const getDateAsUTC = (dateString) => {
        if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
           return new Date(0);
        }
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
    };

    if (filter === 'all') return operations;

    const today = new Date();
    const nowUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    if (filter === 'today') {
        return operations.filter(op => {
            const opDateUTC = getDateAsUTC(op.date);
            return opDateUTC.getTime() === nowUTC.getTime();
        });
    }
    if (filter === 'week') {
        const startOfWeekUTC = new Date(nowUTC);
        startOfWeekUTC.setUTCDate(nowUTC.getUTCDate() - nowUTC.getUTCDay());
        return operations.filter(op => {
             const opDateUTC = getDateAsUTC(op.date);
             return opDateUTC >= startOfWeekUTC;
        });
    }
    if (filter === 'month') {
        const startOfMonthUTC = new Date(Date.UTC(nowUTC.getUTCFullYear(), nowUTC.getUTCMonth(), 1));
        return operations.filter(op => {
            const opDateUTC = getDateAsUTC(op.date);
            return opDateUTC >= startOfMonthUTC;
        });
    }
    return [];
  }, [operations, filter]);

  const dashboardData = useMemo(() => {
    const totalOps = filteredOperations.length;
    if (totalOps === 0) return { winRate: 0, netResult: 0, totalPoints: 0, totalOps: 0, totalLots: 0 };
    const wins = filteredOperations.filter(op => op.status === 'Gain').length;
    const winRate = (wins / totalOps) * 100;
    const netResult = filteredOperations.reduce((acc, op) => acc + op.result, 0);
    const totalPoints = filteredOperations.reduce((acc, op) => acc + op.points, 0);
    const totalLots = filteredOperations.reduce((acc, op) => acc + op.lots, 0);
    return { winRate, netResult, totalPoints, totalOps, totalLots };
  }, [filteredOperations]);

  const analysisData = useMemo(() => {
    const triggerData = {};
    const regionData = {};
    const sideData = { [t.buy]: { result: 0, count: 0 }, [t.sell]: { result: 0, count: 0 }};

    filteredOperations.forEach(op => {
      if (op.status === 'Break-even') return;
      if (!triggerData[op.trigger]) triggerData[op.trigger] = { result: 0, count: 0 };
      triggerData[op.trigger].result += op.result;
      triggerData[op.trigger].count += 1;
      if (!regionData[op.region]) regionData[op.region] = { result: 0, count: 0 };
      regionData[op.region].result += op.result;
      regionData[op.region].count += 1;
      const sideKey = op.side === 'Buy' ? t.buy : t.sell;
      sideData[sideKey].result += op.result;
      sideData[sideKey].count += 1;
    });
    return { triggerData, regionData, sideData };
  }, [filteredOperations, t.buy, t.sell]);

  const cumulativeChartData = useMemo(() => {
    const sortedOps = [...filteredOperations].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.opNumber - b.opNumber);
    let cumulative = 0;
    return sortedOps.map(op => {
      cumulative += op.result;
      return { date: op.date, value: cumulative };
    });
  }, [filteredOperations]);
  
  const exportToCSV = async () => {
    const { default: Papa } = await import('https://esm.sh/papaparse@5.4.1');
    const csv = Papa.unparse(operations);
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    const filename = `Diario_Trade_${formattedDate}.csv`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => fileInputRef.current?.click();
  
  const handleFileImport = async (event) => {
    if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];
        const { default: Papa } = await import('https://esm.sh/papaparse@5.4.1');
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: header => header.toLowerCase().replace(/[\s_]/g, ''),
            complete: (results) => {
                try {
                     const headerMapping = {
                        'opnumber': 'opNumber', 'op#': 'opNumber', 'nro.daoperação': 'opNumber',
                        'asset': 'asset', 'ativo': 'asset',
                        'side': 'side', 'lado': 'side',
                        'date': 'date', 'data': 'date',
                        'lots': 'lots', 'lotes': 'lots',
                        'entryprice': 'entryPrice', 'preçodeentrada': 'entryPrice', 'entrada': 'entryPrice',
                        'exitprice': 'exitPrice', 'preçodesaída': 'exitPrice', 'saída': 'exitPrice',
                        'points': 'points', 'pontos': 'points',
                        'result': 'result', 'resultado': 'result',
                        'status': 'status',
                        'region': 'region', 'região': 'region',
                        'structure': 'structure', 'estrutura': 'structure',
                        'trigger': 'trigger', 'gatilho': 'trigger',
                    };

                    const importedOps = results.data.map((row, index) => {
                        const normalizedRow = {};
                        for (const key in row) {
                            if (headerMapping[key]) {
                                normalizedRow[headerMapping[key]] = row[key];
                            }
                        }

                        const id = Date.now() + index;
                        const opNumber = parseInt(normalizedRow.opNumber || '0', 10);
                        const lots = parseInt(normalizedRow.lots || '0', 10);
                        const entryPrice = parseCurrency(normalizedRow.entryPrice);
                        const exitPrice = parseCurrency(normalizedRow.exitPrice);
                        const points = parseCurrency(normalizedRow.points);
                        const result = parseCurrency(normalizedRow.result);

                        if (isNaN(opNumber) || isNaN(lots)) {
                            throw new Error(`Invalid number in row ${index + 2}.`);
                        }

                        return {
                            id, opNumber, lots, entryPrice, exitPrice, points, result,
                            asset: String(normalizedRow.asset || ''),
                            side: normalizedRow.side === 'Buy' || normalizedRow.side === 'Sell' ? normalizedRow.side : 'Buy',
                            date: String(normalizedRow.date || new Date().toISOString().split('T')[0]),
                            status: normalizedRow.status === 'Gain' || normalizedRow.status === 'Loss' || normalizedRow.status === 'Break-even' ? normalizedRow.status : 'Break-even',
                            region: String(normalizedRow.region || ''),
                            structure: String(normalizedRow.structure || ''),
                            trigger: String(normalizedRow.trigger || ''),
                        };
                    });
                    setOperations(prevOps => [...prevOps, ...importedOps].sort((a,b) => a.opNumber - b.opNumber));
                    alert(t.importSuccess.replace('{count}', String(importedOps.length)));
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    alert(t.importErrorDetail.replace('{error}', errorMessage));
                }
            },
            error: (error) => {
                alert(t.importErrorDetail.replace('{error}', error.message));
            }
        });
    }
    if (event.target) event.target.value = '';
  };

  return (
    React.createElement(React.Fragment, null,
      React.createElement("header", { className: "header" },
        React.createElement("h1", null, t.title),
        React.createElement("div", { className: "lang-switcher" }, React.createElement("button", { onClick: handleLanguageToggle }, t.toggleLang))
      ),
      
      React.createElement("main", { className: "main-layout" },
        React.createElement("aside", { className: "form-container" },
          React.createElement("h2", null, editingId ? t.updateOperation : t.newOperation),
          React.createElement("form", { className: "operation-form", onSubmit: handleSubmit },
            React.createElement("div", { className: "form-grid" },
                React.createElement("div", { className: "form-group full-width" },
                    React.createElement("label", { htmlFor: "asset" }, t.asset),
                    React.createElement("input", { type: "text", id: "asset", name: "asset", value: formState.asset, onChange: handleInputChange, required: true })
                ),
                React.createElement("div", { className: "form-group" },
                    React.createElement("label", { htmlFor: "date" }, t.date),
                    React.createElement("input", { type: "date", id: "date", name: "date", value: formState.date, onChange: handleInputChange, required: true })
                ),
                React.createElement("div", { className: "form-group" },
                    React.createElement("label", { htmlFor: "side" }, t.side),
                    React.createElement("select", { id: "side", name: "side", value: formState.side, onChange: handleInputChange },
                        React.createElement("option", { value: "Buy" }, t.buy),
                        React.createElement("option", { value: "Sell" }, t.sell)
                    )
                ),
                React.createElement("div", { className: "form-group" },
                    React.createElement("label", { htmlFor: "lots" }, t.lots),
                    React.createElement("input", { type: "number", id: "lots", name: "lots", value: formState.lots, onChange: handleInputChange, required: true, min: "1" })
                ),
                React.createElement("div", { className: "form-group" },
                    React.createElement("label", { htmlFor: "pointValue" }, t.pointValue),
                    React.createElement("input", { type: "number", id: "pointValue", name: "pointValue", value: formState.pointValue, onChange: handleInputChange, required: true, step: "0.01" })
                ),
                React.createElement("div", { className: "form-group" },
                    React.createElement("label", { htmlFor: "entryPrice" }, t.entryPrice),
                    React.createElement("input", { type: "text", id: "entryPrice", name: "entryPrice", value: formState.entryPrice, onChange: handleInputChange, required: true })
                ),
                React.createElement("div", { className: "form-group" },
                    React.createElement("label", { htmlFor: "exitPrice" }, t.exitPrice),
                    React.createElement("input", { type: "text", id: "exitPrice", name: "exitPrice", value: formState.exitPrice, onChange: handleInputChange, required: true })
                ),
                React.createElement("div", { className: "form-group full-width" },
                    React.createElement("label", null, t.region),
                    React.createElement("div", { className: "radio-group-wrapper" },
                      React.createElement("div", { className: "radio-group" },
                          regions.map(r => React.createElement("label", { key: r }, React.createElement("input", { type: "radio", name: "region", value: r, checked: !isAddingRegion && formState.region === r, onChange: (e) => { setIsAddingRegion(false); handleInputChange(e); } }), " ", r))
                      ),
                      React.createElement("button", { type: "button", className: "add-new-btn", onClick: () => setIsAddingRegion(!isAddingRegion) }, "+")
                    ),
                     isAddingRegion && (
                        React.createElement("input", { type: "text", name: "newRegion", value: formState.newRegion, onChange: handleInputChange, placeholder: t.addNewRegion, style: { marginTop: '0.5rem' } })
                    )
                ),
                React.createElement("div", { className: "form-group full-width" },
                    React.createElement("label", { htmlFor: "structure" }, t.structure),
                    React.createElement("input", { type: "text", id: "structure", name: "structure", value: formState.structure, onChange: handleInputChange })
                ),
                React.createElement("div", { className: "form-group full-width" },
                    React.createElement("label", { htmlFor: "trigger" }, t.trigger),
                     React.createElement("div", { className: "select-with-add" },
                        React.createElement("select", { id: "trigger", name: "trigger", value: formState.trigger, onChange: (e) => { setIsAddingTrigger(false); handleInputChange(e); }, style: { flex: 1 } },
                            triggers.map(tr => React.createElement("option", { key: tr, value: tr }, tr))
                        ),
                        React.createElement("button", { type: "button", className: "add-new-btn", onClick: () => setIsAddingTrigger(!isAddingTrigger) }, "+")
                    ),
                    isAddingTrigger && (
                        React.createElement("input", { type: "text", name: "newTrigger", value: formState.newTrigger, onChange: handleInputChange, placeholder: t.addNewTrigger, style: { marginTop: '0.5rem' } })
                    )
                )
            ),
            React.createElement("div", { className: "form-actions" },
                React.createElement("button", { type: "submit", className: "submit-btn" }, editingId ? t.updateOperation : t.addOperation),
                editingId && React.createElement("button", { type: "button", className: "cancel-btn", onClick: resetForm }, t.cancelEdit)
            )
          ),

          aiFeedback.visible && (
            React.createElement("div", { className: "ai-feedback-container" },
              React.createElement("h3", null, t.aiCoach.title),
              aiFeedback.loading ? React.createElement("div", { className: "ai-feedback-loading" }, t.aiCoach.loading) : React.createElement("p", null, aiFeedback.text)
            )
          )
        ),

        React.createElement("section", { className: "data-container" },
          React.createElement("h2", null, t.dashboard),
          React.createElement("div", { className: "filter-controls" },
            (Object.keys(t.filters)).map(key => 
                React.createElement("button", { key: key, className: `filter-btn ${filter === key ? 'active' : ''}`, onClick: () => setFilter(key) }, t.filters[key])
            )
          ),
          React.createElement("div", { className: "dashboard" },
             React.createElement("div", { className: "stat-card" }, React.createElement("h3", null, t.winRate), React.createElement("p", null, dashboardData.winRate.toFixed(1), "%")),
             React.createElement("div", { className: "stat-card" }, React.createElement("h3", null, t.netResult), React.createElement("p", { className: dashboardData.netResult > 0 ? 'gain' : dashboardData.netResult < 0 ? 'loss' : '' }, dashboardData.netResult.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', { style: 'currency', currency: 'BRL' }))),
             React.createElement("div", { className: "stat-card" }, React.createElement("h3", null, t.totalPoints), React.createElement("p", null, dashboardData.totalPoints.toFixed(2))),
             React.createElement("div", { className: "stat-card" }, React.createElement("h3", null, t.totalOps), React.createElement("p", null, dashboardData.totalOps)),
             React.createElement("div", { className: "stat-card" }, React.createElement("h3", null, t.totalLots), React.createElement("p", null, dashboardData.totalLots))
          ),
          
          React.createElement(LineChart, { data: cumulativeChartData, title: t.cumulativeResult, noDataMessage: t.noChartData }),

          React.createElement("h2", null, t.regAnalysis),
          React.createElement("div", { className: "charts-grid" },
              React.createElement(BarChart, { data: analysisData.triggerData, title: t.triggerPerformance, lang: language, noDataMessage: t.noChartData }),
              React.createElement(BarChart, { data: analysisData.regionData, title: t.regionPerformance, lang: language, noDataMessage: t.noChartData }),
              React.createElement(BarChart, { data: analysisData.sideData, title: t.performanceBySide, lang: language, noDataMessage: t.noChartData })
          ),

          React.createElement("div", { className: "table-header" },
            React.createElement("h2", null, t.operationsLog),
            React.createElement("div", { className: "table-actions" },
              React.createElement("input", { type: "file", ref: fileInputRef, onChange: handleFileImport, style: { display: 'none' }, accept: ".csv" }),
              React.createElement("button", { className: "import-btn", onClick: handleImportClick }, t.importCSV),
              React.createElement("button", { className: "export-btn", onClick: exportToCSV, disabled: operations.length === 0 }, t.exportCSV)
            )
          ),
          React.createElement("div", { className: "table-wrapper" },
             filteredOperations.length > 0 ? (
                React.createElement("table", { className: "operations-table" },
                    React.createElement("thead", null, React.createElement("tr", null, React.createElement("th", null, t.table.op), React.createElement("th", null, t.table.asset), React.createElement("th", null, t.table.date), React.createElement("th", null, t.table.side), React.createElement("th", null, t.table.lots), React.createElement("th", null, t.table.entry), React.createElement("th", null, t.table.exit), React.createElement("th", null, t.table.points), React.createElement("th", null, t.table.result), React.createElement("th", null, t.table.status), React.createElement("th", null, t.table.reg), React.createElement("th", null, t.table.actions))),
                    React.createElement("tbody", null,
                        filteredOperations.map(op => {
                            const statusClass = op.status === 'Gain' ? 'status-gain' : op.status === 'Loss' ? 'status-loss' : 'status-breakeven';
                            return (
                                React.createElement("tr", { key: op.id },
                                    React.createElement("td", null, op.opNumber), React.createElement("td", null, op.asset), React.createElement("td", null, formatDateToBR(op.date)), React.createElement("td", null, op.side === 'Buy' ? t.buy : t.sell), React.createElement("td", null, op.lots), React.createElement("td", null, op.entryPrice.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')), React.createElement("td", null, op.exitPrice.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US')), React.createElement("td", null, op.points.toFixed(2)),
                                    React.createElement("td", { className: statusClass }, op.result.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', { style: 'currency', currency: 'BRL' })),
                                    React.createElement("td", { className: statusClass }, op.status === 'Break-even' ? t.breakEven : op.status),
                                    React.createElement("td", null, `${op.region}, ${op.structure}, ${op.trigger}`),
                                    React.createElement("td", { className: "actions-cell" },
                                        React.createElement("button", { onClick: () => handleEdit(op), className: "action-btn edit-btn" }, t.table.edit),
                                        React.createElement("button", { onClick: () => setOperationToDelete(op), className: "action-btn delete-btn" }, t.table.delete)
                                    )
                                )
                            );
                        })
                    )
                )
             ) : (React.createElement("p", { className: "no-data" }, t.noData)))
          )
        )
      ),

      React.createElement(Modal, { isOpen: !!operationToDelete, onClose: () => setOperationToDelete(null), title: t.deleteConfirmTitle },
        React.createElement(React.Fragment, null,
            React.createElement("p", null, t.deleteConfirmMessage
                .replace('{opNumber}', String(operationToDelete?.opNumber))
                .replace('{asset}', String(operationToDelete?.asset))
            ),
            React.createElement("div", { className: "modal-footer" },
                React.createElement("button", { className: "modal-btn modal-btn-cancel", onClick: () => setOperationToDelete(null) }, t.cancel),
                React.createElement("button", { className: "modal-btn modal-btn-delete", onClick: confirmDelete }, t.confirm)
            )
        )
      )
    )
};

const container = document.getElementById('root');
createRoot(container).render(React.createElement(App, null));
