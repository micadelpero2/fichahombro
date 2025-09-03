
// Declara las variables globales de las librerías para que TypeScript no se queje
declare var jsPDF: any;
declare var htmlToDocx: any;
declare var XLSX: any;

document.addEventListener('DOMContentLoaded', function () {
    const dashboardView = document.getElementById('dashboard-view');
    const formView = document.getElementById('form-view');
    const newEvaluationBtn = document.getElementById('new-evaluation-btn');
    const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');

    // --- Lógica de Navegación Principal (Dashboard <-> Formulario) ---
    if (dashboardView && formView && newEvaluationBtn && backToDashboardBtn) {
        newEvaluationBtn.addEventListener('click', () => {
            dashboardView.classList.add('hidden');
            formView.classList.remove('hidden');
            window.scrollTo(0, 0); // Vuelve al inicio de la página
        });

        backToDashboardBtn.addEventListener('click', () => {
            formView.classList.add('hidden');
            dashboardView.classList.remove('hidden');
            window.scrollTo(0, 0); // Vuelve al inicio de la página
        });
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

    // --- Lógica de Generación y Guardado de Ficha Final ---
    const generateFinalFichaBtn = document.getElementById('generate-final-ficha-btn');
    const downloadOptions = document.getElementById('download-options');
    const fichaDisplayContainer = document.getElementById('ficha-display-container');

    const getValue = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value.trim() || 'No especificado';
    
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

        return `
            <div class="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
                <h2 class="text-2xl font-bold text-center text-gray-800 mb-2">Ficha Clínica Kinesiológica</h2>
                <p class="text-center text-gray-500 text-sm mb-6">Generada el: ${new Date(data.timestamp).toLocaleString()}</p>
                
                <div class="space-y-6">
                    ${section('A. Datos Personales y Antecedentes', datosPersonalesContent)}
                    ${section('B. Historia del Episodio', historiaEpisodioContent)}
                    ${section('C. Factores de Riesgo', factoresRiesgoContent)}
                    ${section('Análisis Funcional del Hombro (CIF)', cifContent)}
                    ${section('Evaluación Física', '<p>Asistente IA utilizado para la evaluación y consulta.</p>')}
                    ${section('G. Observaciones', `<p>${data.observaciones}</p>`)}
                </div>
            </div>
        `;
    };

    // Función para guardar la ficha generada en Local Storage
    const saveFichaToLocalStorage = (data: any) => {
        try {
            const fichasGuardadas = JSON.parse(localStorage.getItem('fichasPacientes') || '[]');
            fichasGuardadas.push(data);
            localStorage.setItem('fichasPacientes', JSON.stringify(fichasGuardadas));
        } catch (error) {
            console.error('Error al guardar la ficha en Local Storage:', error);
        }
    };
    
    if (generateFinalFichaBtn && fichaDisplayContainer && downloadOptions) {
        generateFinalFichaBtn.addEventListener('click', () => {
            const patientData = getPatientDataAsObject();
            const fichaHtml = createFichaHtml(patientData);
            
            fichaDisplayContainer.innerHTML = fichaHtml;
            fichaDisplayContainer.classList.remove('hidden');

            saveFichaToLocalStorage(patientData);
            
            downloadOptions.classList.remove('hidden');
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