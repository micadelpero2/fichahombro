// Declara las variables globales de las librerías para que TypeScript no se queje
declare var jsPDF: any;
declare var htmlToDocx: any;
declare var XLSX: any;

document.addEventListener('DOMContentLoaded', function () {
    
    // --- Vistas de la Aplicación ---
    const dashboardView = document.getElementById('dashboard-view');
    const formView = document.getElementById('form-view');
    const recordsView = document.getElementById('records-view');

    // --- Botones de Navegación Principal ---
    const newEvaluationBtn = document.getElementById('new-evaluation-btn');
    const viewRecordsBtn = document.getElementById('view-records-btn');
    const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
    const backToDashboardBtnFromRecords = document.getElementById('back-to-dashboard-btn-from-records');
    
    // --- Contenedor de la lista de pacientes ---
    const patientListContainer = document.getElementById('patient-list-container');


    // --- Lógica de Navegación entre Vistas ---
    const showView = (viewToShow: HTMLElement | null) => {
        [dashboardView, formView, recordsView].forEach(view => {
            view?.classList.add('hidden');
        });
        viewToShow?.classList.remove('hidden');
        window.scrollTo(0, 0);
    };

    if (newEvaluationBtn) {
        newEvaluationBtn.addEventListener('click', () => {
            const kineForm = document.getElementById('kine-form') as HTMLFormElement;
            if(kineForm) {
                 kineForm.reset();
            }
            const fichaDisplay = document.getElementById('ficha-display-container');
            const downloadOptions = document.getElementById('download-options');
            if(fichaDisplay) fichaDisplay.innerHTML = '';
            if(downloadOptions) downloadOptions.classList.add('hidden');
            showView(formView);
        });
    }

    if (viewRecordsBtn) {
        viewRecordsBtn.addEventListener('click', () => {
            displaySavedFichas();
            showView(recordsView);
        });
    }
    
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => showView(dashboardView));
    }
    
    if (backToDashboardBtnFromRecords) {
        backToDashboardBtnFromRecords.addEventListener('click', () => showView(dashboardView));
    }


    // --- Lógica de la Ficha de Evaluación ---
    const allTabButtons = document.querySelectorAll<HTMLElement>('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // --- Lógica de Navegación de Pestañas ---
    const switchTab = (targetId: string | undefined) => {
        if (!targetId) {
            return;
        }
        tabContents.forEach(content => content.classList.add('hidden'));
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
            targetContent.classList.remove('hidden');
        }

        allTabButtons.forEach(button => {
            const isTargetButton = button.dataset.target === targetId;
            const isDesktopButton = button.closest('aside') !== null;
            if (isDesktopButton) {
                button.classList.toggle('bg-blue-50', isTargetButton);
                button.classList.toggle('text-blue-700', isTargetButton);
                button.classList.toggle('font-semibold', isTargetButton);
                button.classList.toggle('text-gray-700', !isTargetButton);
                button.classList.toggle('hover:bg-gray-100', !isTargetButton);
                button.classList.toggle('hover:text-gray-800', !isTargetButton);
            } else {
                button.classList.toggle('text-blue-600', isTargetButton);
                button.classList.toggle('border-blue-600', isTargetButton);
                button.classList.toggle('font-semibold', isTargetButton);
                button.classList.toggle('text-gray-500', !isTargetButton);
                button.classList.toggle('border-transparent', !isTargetButton);
                button.classList.toggle('hover:border-gray-300', !isTargetButton);
                button.classList.toggle('hover:text-gray-700', !isTargetButton);
            }
        });
    };

    allTabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(button.dataset.target);
        });
    });

    if (allTabButtons.length > 0) {
        switchTab(allTabButtons[0].dataset.target);
    }
    
    const getValue = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value.trim() || 'No especificado';

    // --- Lógica de Gestión de Fichas (Guardar, Cargar, Listar) ---
    
    const getFichasFromLocalStorage = () => {
        try {
            return JSON.parse(localStorage.getItem('fichasPacientes') || '[]');
        } catch (error) {
            console.error('Error al leer fichas de Local Storage:', error);
            return [];
        }
    };

    const displaySavedFichas = () => {
        if (!patientListContainer) return;
        
        const fichasGuardadas = getFichasFromLocalStorage();
        patientListContainer.innerHTML = ''; // Limpiar lista

        if (fichasGuardadas.length === 0) {
            patientListContainer.innerHTML = `<p class="text-center text-gray-500">Aún no hay fichas guardadas.</p>`;
            return;
        }

        fichasGuardadas.forEach((ficha: any) => {
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors';
            card.innerHTML = `
                <div>
                    <h3 class="font-semibold text-lg text-slate-800">${ficha.nombre || 'Paciente sin nombre'}</h3>
                    <p class="text-sm text-slate-500">Fecha: ${new Date(ficha.timestamp).toLocaleDateString()}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            `;
            card.addEventListener('click', () => {
                loadFichaIntoForm(ficha);
                showView(formView);
            });
            patientListContainer.appendChild(card);
        });
    };
    
    const loadFichaIntoForm = (fichaData: any) => {
        for (const key in fichaData) {
            const element = document.getElementById(key) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
            if (element) {
                element.value = fichaData[key];
            }
        }
        // Después de cargar los datos, mostrar la ficha si es necesario
        const patientData = getPatientDataAsObject();
        const fichaHtml = createFichaHtml(patientData);
        if(fichaDisplayContainer && downloadOptions) {
            fichaDisplayContainer.innerHTML = fichaHtml;
            fichaDisplayContainer.classList.remove('hidden');
            downloadOptions.classList.remove('hidden');
        }
    };

    // --- Lógica para Descargar Anamnesis Parcial en PDF ---
    const downloadAnamnesisPdfBtn = document.getElementById('download-anamnesis-pdf-btn');
    if (downloadAnamnesisPdfBtn) {
        downloadAnamnesisPdfBtn.addEventListener('click', () => {
            const doc = new jsPDF();
            const patientName = getValue('nombre') || 'paciente';
            const date = new Date().toISOString().slice(0, 10);
            const fileName = `Anamnesis_${patientName.replace(/\s/g, '_')}_${date}.pdf`;

            doc.setFontSize(18);
            doc.text(`Ficha de Anamnesis - ${patientName}`, 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);

            let y = 35;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;

            const addText = (text: string, isTitle: boolean = false) => {
                if (y > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }
                if (isTitle) {
                    doc.setFont(undefined, 'bold');
                    doc.setFontSize(14);
                    y += 8; 
                    doc.text(text, 14, y);
                    y += 8;
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(11);
                } else {
                    const lines = doc.splitTextToSize(text, 180);
                    doc.text(lines, 14, y);
                    y += (lines.length * 5);
                }
            };

            const addField = (label: string, value: string) => {
                addText(`${label}: ${value || 'No especificado'}`);
                y += 2;
            };

            // Tab 1: Datos y Anamnesis
            addText("A. Datos Personales y Antecedentes", true);
            addField('Nombre', getValue('nombre'));
            addField('Edad', getValue('edad'));
            addField('Nacionalidad', getValue('nacionalidad'));
            addField('Estado Civil', getValue('estadoCivil'));
            addField('Obra Social', getValue('obraSocial'));
            addField('Teléfono', getValue('telefono'));
            addField('Domicilio', getValue('domicilio'));
            addField('Actividades Previas y Actuales', getValue('actividades'));
            addField('Antecedentes Médicos y Quirúrgicos', getValue('antMedicosQuirurgicos'));
            addField('Medicación Actual y para el Dolor', getValue('medicacion'));

            addText("B. Historia del Episodio", true);
            addField('Fecha y Causa de la Lesión', getValue('fechaCausaLesion'));
            addField('Primera Atención Médica', getValue('primerAtencion'));
            addField('Mecanismo de Producción', getValue('mecanismoProduccion'));
            addField('Estudios Complementarios', getValue('estudiosComplementarios'));
            addField('Detalles de Cirugías Previas', getValue('cirugiasPrevias'));
            addField('Lateralidad Dominante', getValue('lateralidad'));

            // Tab 2: Factores de Riesgo
            addText("C. Factores de Riesgo", true);
            addField('Menopausia, Osteopenia/Osteoporosis', getValue('menopausiaOsteoporosis'));
            addField('Caídas en los últimos 6 meses', getValue('caidas'));
            addField('Test "Get Up and Go" (TUG)', getValue('tug'));
            addField('Tabaquismo, Alcoholismo, etc.', getValue('tabaquismoAlcoholismo'));
            addField('Enfermedades Asociadas', getValue('enfermedadesAsociadas'));
            
            // Tab 3: Análisis Funcional (CIF)
            addText("Análisis Funcional del Hombro (CIF)", true);
            addText("Actividades y Participación (d) - Limitaciones en AVD");
            y += 4;
            addField('Peinarse o lavarse el pelo', getValue('cif-d-peinarse'));
            addField('Lavarse la espalda', getValue('cif-d-lavarse-espalda'));
            addField('Alcanzar un objeto en un estante alto', getValue('cif-d-alcanzar-alto'));
            addField('Abrocharse por la espalda', getValue('cif-d-abrocharse'));
            addField('Ponerse una chaqueta o abrigo', getValue('cif-d-chaqueta'));
            addField('Llevar un objeto pesado (ej. bolsa)', getValue('cif-d-llevar-peso'));
            addField('Dormir sobre el lado afectado', getValue('cif-d-dormir'));
            addField('Otras actividades específicas limitadas', getValue('cif-d-actividades-especificas'));
            y+=4;
            addText("Factores Contextuales");
            y+=4;
            addField('Factores Ambientales (e)', getValue('cif-ambientales'));
            addField('Factores Personales', getValue('cif-personales'));

            doc.save(fileName);
        });
    }

    // --- Lógica de Generación y Guardado de Ficha Final ---
    const generateFinalFichaBtn = document.getElementById('generate-final-ficha-btn');
    const downloadOptions = document.getElementById('download-options');
    const fichaDisplayContainer = document.getElementById('ficha-display-container');
    const aiSummaryLoader = document.getElementById('ai-summary-loader');
    
    // Helper para obtener todos los datos del formulario como un objeto
    const getPatientDataAsObject = () => {
        return {
            // A. Datos Personales
            nombre: getValue('nombre'),
            edad: getValue('edad'),
            nacionalidad: getValue('nacionalidad'),
            estadoCivil: getValue('estadoCivil'),
            obraSocial: getValue('obraSocial'),
            telefono: getValue('telefono'),
            domicilio: getValue('domicilio'),
            actividades: getValue('actividades'),
            antMedicosQuirurgicos: getValue('antMedicosQuirurgicos'),
            medicacion: getValue('medicacion'),
            // B. Historia Episodio
            fechaCausaLesion: getValue('fechaCausaLesion'),
            primerAtencion: getValue('primerAtencion'),
            mecanismoProduccion: getValue('mecanismoProduccion'),
            estudiosComplementarios: getValue('estudiosComplementarios'),
            cirugiasPrevias: getValue('cirugiasPrevias'),
            lateralidad: getValue('lateralidad'),
            // C. Factores de Riesgo
            menopausiaOsteoporosis: getValue('menopausiaOsteoporosis'),
            caidas: getValue('caidas'),
            tug: getValue('tug'),
            tabaquismoAlcoholismo: getValue('tabaquismoAlcoholismo'),
            enfermedadesAsociadas: getValue('enfermedadesAsociadas'),
            // Análisis Funcional (CIF)
            cifPeinarse: getValue('cif-d-peinarse'),
            cifLavarseEspalda: getValue('cif-d-lavarse-espalda'),
            cifAlcanzarAlto: getValue('cif-d-alcanzar-alto'),
            cifAbrocharse: getValue('cif-d-abrocharse'),
            cifChaqueta: getValue('cif-d-chaqueta'),
            cifLlevarPeso: getValue('cif-d-llevar-peso'),
            cifDormir: getValue('cif-d-dormir'),
            cifActividadesEspecificas: getValue('cif-d-actividades-especificas'),
            cifAmbientales: getValue('cif-ambientales'),
            cifPersonales: getValue('cif-personales'),
            // Observaciones
            observaciones: getValue('observacionesGenerales'),
            timestamp: new Date().toISOString()
        };
    };

    const generateAISummary = async (data: any) => {
        // Genera el prompt para la IA
        const prompt = `
            Eres un experto kinesiólogo especialista en rehabilitación de hombro.
            Analiza los siguientes datos de la ficha de un paciente y genera un resumen clínico conciso y profesional.
            El resumen debe incluir:
            1.  **Impresión Clínica Inicial:** Una breve descripción del posible diagnóstico o la naturaleza del problema.
            2.  **Factores Clave:** Menciona los 2-3 factores más relevantes (antecedentes, funcionales, de riesgo) que destacan del caso.
            3.  **Posibles Banderas (Rojas/Amarillas):** Identifica cualquier dato que pueda sugerir una patología más seria o factores psicosociales importantes.
            4.  **Recomendaciones Iniciales:** Sugiere un enfoque general para la evaluación física y el tratamiento inicial.

            Formato de salida: Usa markdown con encabezados (##) para cada sección.

            Datos del paciente:
            ${JSON.stringify(data, null, 2)}
        `;

        try {
            // Llama a tu función de backend
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });

            if (!response.ok) {
                throw new Error('Error en la llamada a la API');
            }

            const result = await response.json();
            return result.text; // El backend devuelve el texto bajo la propiedad 'text'
        } catch (error) {
            console.error("Error al generar resumen con IA:", error);
            return "Error: No se pudo generar el resumen clínico. Por favor, revisa la consola para más detalles.";
        }
    };
    
    // Helper para crear el HTML visual de la ficha
    const createFichaHtml = (data: any) => {
        const section = (title: string, content: string) => `
            <div>
                <h3 class="font-semibold text-lg text-blue-700 border-b-2 border-blue-200 pb-2 mb-3">${title}</h3>
                <div class="prose prose-sm max-w-none text-gray-700">${content}</div>
            </div>
        `;

        const datosPersonalesContent = `
            <p><strong>Nombre:</strong> ${data.nombre}</p>
            <p><strong>Edad:</strong> ${data.edad}</p>
            <p><strong>Actividades Previas y Actuales:</strong> ${data.actividades}</p>
            <p><strong>Antecedentes Médicos/Quirúrgicos:</strong> ${data.antMedicosQuirurgicos}</p>
            <p><strong>Medicación Actual:</strong> ${data.medicacion}</p>
        `;

        const historiaEpisodioContent = `
            <p><strong>Fecha y Causa de Lesión:</strong> ${data.fechaCausaLesion}</p>
            <p><strong>Mecanismo de Producción:</strong> ${data.mecanismoProduccion}</p>
            <p><strong>Estudios Complementarios:</strong> ${data.estudiosComplementarios}</p>
        `;
        
        const factoresRiesgoContent = `
            <p><strong>Menopausia/Osteoporosis:</strong> ${data.menopausiaOsteoporosis}</p>
            <p><strong>Caídas (últimos 6 meses):</strong> ${data.caidas}</p>
            <p><strong>Tabaquismo/Alcoholismo:</strong> ${data.tabaquismoAlcoholismo}</p>
            <p><strong>Enfermedades Asociadas:</strong> ${data.enfermedadesAsociadas}</p>
        `;

        const cifContent = `
            <h4 class="font-semibold mt-4 mb-2">Limitaciones en AVD:</h4>
            <ul>
                <li><strong>Peinarse o lavarse el pelo:</strong> ${data.cifPeinarse}</li>
                <li><strong>Lavarse la espalda:</strong> ${data.cifLavarseEspalda}</li>
                <li><strong>Alcanzar objeto alto:</strong> ${data.cifAlcanzarAlto}</li>
                <li><strong>Dormir sobre lado afectado:</strong> ${data.cifDormir}</li>
            </ul>
            <p><strong>Otras actividades específicas limitadas:</strong> ${data.cifActividadesEspecificas}</p>
            <p><strong>Factores Ambientales (e):</strong> ${data.cifAmbientales}</p>
            <p><strong>Factores Personales:</strong> ${data.cifPersonales}</p>
        `;
        
         const iaSummaryContent = `
            <p>Asistente IA utilizado para la evaluación y consulta.</p>
        `;


        return `
            <div class="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
                <h2 class="text-2xl font-bold text-center text-gray-800 mb-2">Ficha Clínica Kinesiológica</h2>
                <p class="text-center text-gray-500 text-sm mb-6">Generada el: ${new Date(data.timestamp).toLocaleString()}</p>
                
                <div class="space-y-6">
                    ${section('A. Datos Personales y Antecedentes', datosPersonalesContent)}
                    ${section('B. Historia del Episodio', historiaEpisodioContent)}
                    ${section('C. Factores de Riesgo', factoresRiesgoContent)}
                    ${section('Análisis Funcional del Hombro (CIF)', cifContent)}
                    ${section('Evaluación Física', iaSummaryContent)}
                    ${section('G. Observaciones', `<p>${data.observaciones}</p>`)}
                </div>
            </div>
        `;
    };


    const saveFichaToLocalStorage = (data: any) => {
        try {
            let fichasGuardadas = getFichasFromLocalStorage();
            // Evitar duplicados si se edita: buscar por timestamp.
            const existingIndex = fichasGuardadas.findIndex((f: any) => f.timestamp === data.timestamp);
            if (existingIndex > -1) {
                fichasGuardadas[existingIndex] = data; // Actualiza
            } else {
                fichasGuardadas.push(data); // Agrega nuevo
            }
            localStorage.setItem('fichasPacientes', JSON.stringify(fichasGuardadas));
        } catch (error) {
            console.error('Error al guardar la ficha en Local Storage:', error);
        }
    };
    
    if (generateFinalFichaBtn && fichaDisplayContainer && downloadOptions && aiSummaryLoader) {
        generateFinalFichaBtn.addEventListener('click', async () => {
            const patientData = getPatientDataAsObject();
            
            // UI de carga
            aiSummaryLoader.classList.remove('hidden');
            fichaDisplayContainer.classList.add('hidden');
            downloadOptions.classList.add('hidden');
            
            const summaryText = await generateAISummary(patientData);
            
            // Reemplaza los encabezados y saltos de línea para que se vean bien
            const summaryHtml = summaryText.replace(/## (.*)/g, '<h3 class="font-semibold text-lg text-blue-700 mt-4 mb-2">$1</h3>')
                                            .replace(/\n/g, '<br>');

            fichaDisplayContainer.innerHTML = `
                <div class="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
                    <h2 class="text-2xl font-bold text-center text-gray-800 mb-6">Resumen Clínico (Generado por IA)</h2>
                    ${summaryHtml}
                </div>
            `;
            
            // Ocultar carga y mostrar resultados
            aiSummaryLoader.classList.add('hidden');
            fichaDisplayContainer.classList.remove('hidden');
            downloadOptions.classList.remove('hidden');

            saveFichaToLocalStorage(patientData);
        });
    }

    // --- Lógica para Descargar Ficha en diferentes formatos ---
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const downloadDocxBtn = document.getElementById('download-docx-btn');
    const downloadXlsxBtn = document.getElementById('download-xlsx-btn');

    const getFileName = () => {
        const nombrePaciente = getValue('nombre') || 'paciente';
        const fecha = new Date().toISOString().slice(0, 10);
        return `Ficha_${nombrePaciente.replace(/\s/g, '_')}_${fecha}`;
    };

    if (downloadPdfBtn && fichaDisplayContainer) {
        downloadPdfBtn.addEventListener('click', () => {
            const doc = new jsPDF();
            const textContent = fichaDisplayContainer.innerText;
            const lines = doc.splitTextToSize(textContent, 180);
            doc.text(lines, 10, 10);
            doc.save(`${getFileName()}.pdf`);
        });
    }

    if (downloadDocxBtn && fichaDisplayContainer) {
        downloadDocxBtn.addEventListener('click', async () => {
            const content = fichaDisplayContainer.innerHTML;
            const fileBuffer = await htmlToDocx.asBlob(`<!DOCTYPE html><html><head><title>Ficha Clínica</title></head><body>${content}</body></html>`);
            const url = URL.createObjectURL(fileBuffer);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${getFileName()}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
    
    if (downloadXlsxBtn) {
        downloadXlsxBtn.addEventListener('click', () => {
            const data = [
                ["Sección", "Campo", "Valor"],
                ["Datos Personales", "Nombre", getValue('nombre')],
                ["Datos Personales", "Edad", getValue('edad')],
                ["Datos Personales", "Nacionalidad", getValue('nacionalidad')],
                ["Datos Personales", "Estado Civil", getValue('estadoCivil')],
                ["Datos Personales", "Obra Social", getValue('obraSocial')],
                ["Datos Personales", "Teléfono", getValue('telefono')],
                ["Datos Personales", "Domicilio", getValue('domicilio')],
                ["Datos Personales", "Actividades", getValue('actividades')],
                ["Datos Personales", "Antecedentes Médicos/Quirúrgicos", getValue('antMedicosQuirurgicos')],
                ["Datos Personales", "Medicación", getValue('medicacion')],
                ["Historia Episodio", "Fecha y Causa de Lesión", getValue('fechaCausaLesion')],
                ["Historia Episodio", "Primera Atención", getValue('primerAtencion')],
                ["Historia Episodio", "Mecanismo de Producción", getValue('mecanismoProduccion')],
                ["Historia Episodio", "Estudios Complementarios", getValue('estudiosComplementarios')],
                ["Historia Episodio", "Cirugías Previas", getValue('cirugiasPrevias')],
                ["Historia Episodio", "Lateralidad", getValue('lateralidad')],
                ["Factores de Riesgo", "Menopausia/Osteoporosis", getValue('menopausiaOsteoporosis')],
                ["Factores de Riesgo", "Caídas (últimos 6 meses)", getValue('caidas')],
                ["Factores de Riesgo", "Test 'Get Up and Go' (TUG)", getValue('tug')],
                ["Factores de Riesgo", "Tabaquismo/Alcoholismo", getValue('tabaquismoAlcoholismo')],
                ["Factores de Riesgo", "Enfermedades Asociadas", getValue('enfermedadesAsociadas')],
                ["Análisis Funcional", "Peinarse", getValue('cif-d-peinarse')],
                ["Análisis Funcional", "Lavarse la espalda", getValue('cif-d-lavarse-espalda')],
                ["Análisis Funcional", "Alcanzar objeto alto", getValue('cif-d-alcanzar-alto')],
                ["Análisis Funcional", "Abrocharse por la espalda", getValue('cif-d-abrocharse')],
                ["Análisis Funcional", "Ponerse chaqueta", getValue('cif-d-chaqueta')],
                ["Análisis Funcional", "Llevar objeto pesado", getValue('cif-d-llevar-peso')],
                ["Análisis Funcional", "Dormir sobre lado afectado", getValue('cif-d-dormir')],
                ["Análisis Funcional", "Otras actividades", getValue('cif-d-actividades-especificas')],
                ["Análisis Funcional", "Factores Ambientales (e)", getValue('cif-ambientales')],
                ["Análisis Funcional", "Factores Personales", getValue('cif-personales')],
                ["Evaluación Física", "Asistente IA", "Utilizado para la evaluación y consulta"],
                ["Observaciones", "Observaciones Generales", getValue('observacionesGenerales')],
            ];
            
            const worksheet = XLSX.utils.aoa_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Ficha Paciente");
            XLSX.writeFile(workbook, `${getFileName()}.xlsx`);
        });
    }
});