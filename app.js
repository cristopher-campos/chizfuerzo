// Importar los datos desde el archivo de contenido
// Se ha eliminado la importación de firebaseConfig
import { courses, theoryData, exercisesData } from './data.js';

// Inicializar variables de estado de la aplicación
let selectedCourse = null;
let selectedLevel = 'basico'; // El nivel por defecto
let appContainer;
// Se han eliminado las variables de estado de Firebase: auth, db, user

// ====================================================================
// UTILIDADES
// ====================================================================

/**
 * Normaliza y compara la respuesta del usuario con la respuesta correcta.
 * @param {string|number} userAnswer
 * @param {string|number} correctAnswer
 * @param {string} type - 'text' o 'number'
 */
const checkAnswer = (userAnswer, correctAnswer, type) => {
    if (type === 'number') {
        const numUser = parseFloat(userAnswer);
        const numCorrect = parseFloat(correctAnswer);
        // Tolerancia para números flotantes
        return Math.abs(numUser - numCorrect) < 0.001;
    }

    // Para texto: normalizar (trim, toLowerCase, eliminar puntuación básica)
    const normalize = (str) => String(str).toLowerCase().trim().replace(/[.,!?'"]+/g, '');
    const normalizedUser = normalize(userAnswer);
    const normalizedCorrect = normalize(correctAnswer);
    
    // El texto correcto puede tener varias opciones separadas por '|'
    const correctOptions = normalizedCorrect.split('|').map(opt => opt.trim());
    return correctOptions.some(option => option === normalizedUser);
};

// ====================================================================
// FUNCIONES DE RENDERIZADO (VISTAS)
// ====================================================================

/**
 * Renderiza la vista principal con las tarjetas de los cursos.
 */
const renderCourseCards = () => {
    appContainer.classList.add('opacity-0');

    const courseCardsHtml = courses.map(course => {
        const baseClass = "bg-white p-6 rounded-xl shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-2 flex flex-col items-center text-center border-2 border-blue-100 hover:border-blue-300";
        
        // Manejo especial para el link de Minijuegos
        if (course.isExternal) {
            return `
                <a href="${course.url}" target="_blank" rel="noopener noreferrer" class="${baseClass} bg-yellow-50 hover:bg-yellow-100">
                    <div class="card-icon text-yellow-600 mb-4 text-6xl">${course.icon}</div>
                    <h3 class="text-2xl font-bold text-gray-900 mb-3">${course.name}</h3>
                    <p class="text-gray-600 text-base leading-relaxed">${course.description}</p>
                    <span class="mt-3 text-sm font-semibold text-yellow-700">Ir al sitio externo</span>
                </a>
            `;
        }
        
        // Tarjetas de cursos internos
        return `
            <div id="course-card-${course.id}" class="${baseClass}">
                <div class="card-icon text-blue-700 mb-4 text-6xl">${course.icon}</div>
                <h3 class="text-2xl font-bold text-gray-900 mb-3">${course.name}</h3>
                <p class="text-gray-600 text-base leading-relaxed">${course.description}</p>
            </div>
        `;
    }).join('');

    appContainer.innerHTML = `
        <h1 class="text-5xl font-extrabold text-gray-900 mb-10 text-center fade-in">Elige tu curso y empieza a crecer</h1>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            ${courseCardsHtml}
        </div>
    `;

    // Agregar event listeners a las tarjetas internas
    courses.forEach(course => {
        if (!course.isExternal) {
            document.getElementById(`course-card-${course.id}`)?.addEventListener('click', () => {
                selectedCourse = course;
                selectedLevel = 'basico';
                renderCourseDetail();
            });
        }
    });
    
    appContainer.classList.remove('opacity-0');
    appContainer.classList.add('fade-in');
};

/**
 * Renderiza la vista de detalle para el curso seleccionado.
 */
const renderCourseDetail = () => {
    if (!selectedCourse) return;

    appContainer.classList.add('opacity-0');

    // Botones de navegación de niveles
    const renderLevelTabs = () => {
        const levels = ['basico', 'intermedio', 'avanzado'];
        return levels.map(level => {
            const isActive = selectedLevel === level;
            const activeClass = isActive 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300';
            return `
                <button data-level="${level}" class="level-tab px-6 py-2 text-lg font-semibold rounded-full transition-all ${activeClass}">
                    ${level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
            `;
        }).join('');
    };

    // Renderizar la teoría o los ejercicios
    let contentHtml = '';
    const courseContent = theoryData[selectedCourse.id] || {};
    const courseExercises = exercisesData[selectedCourse.id] || {};
    
    // Pestañas de Teoría y Ejercicios
    const renderSectionTabs = () => {
        const currentSection = appContainer.dataset.section || 'theory'; // 'theory' o 'exercises'
        const activeTheory = currentSection === 'theory' 
            ? 'bg-blue-500 text-white' 
            : 'text-blue-500 hover:bg-blue-100';
        const activeExercises = currentSection === 'exercises' 
            ? 'bg-blue-500 text-white' 
            : 'text-blue-500 hover:bg-blue-100';
            
        return `
            <div class="flex space-x-4 mb-8">
                <button data-section="theory" class="section-tab px-4 py-2 font-semibold rounded-lg transition-colors ${activeTheory}">Teoría</button>
                <button data-section="exercises" class="section-tab px-4 py-2 font-semibold rounded-lg transition-colors ${activeExercises}">Ejercicios</button>
            </div>
        `;
    };
    
    const currentSection = appContainer.dataset.section || 'theory';

    if (currentSection === 'theory') {
        const theory = courseContent[selectedLevel];
        contentHtml = theory ? `<div class="theory-content text-gray-700">${theory}</div>` : '<p>Contenido de teoría no disponible.</p>';
    } else if (currentSection === 'exercises') {
        contentHtml = renderExercises(courseExercises[selectedLevel] || []);
    }

    appContainer.innerHTML = `
        <div class="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-2xl">
            <h1 class="text-4xl font-extrabold text-gray-900 mb-2 flex items-center">
                <button id="back-to-home" class="text-blue-500 hover:text-blue-700 mr-4 text-3xl transition-colors">←</button>
                ${selectedCourse.icon} ${selectedCourse.name}
            </h1>
            <p class="text-gray-500 mb-8">${selectedCourse.description}</p>
            
            <div class="flex justify-center space-x-4 mb-10">
                ${renderLevelTabs()}
            </div>
            
            ${renderSectionTabs()}

            <div id="course-content-area" class="min-h-[300px]">
                ${contentHtml}
            </div>
        </div>
    `;

    // Re-bindear listeners
    document.getElementById('back-to-home').addEventListener('click', () => {
        selectedCourse = null;
        renderApp();
    });

    document.querySelectorAll('.level-tab').forEach(button => {
        button.addEventListener('click', (e) => {
            selectedLevel = e.target.dataset.level;
            renderCourseDetail();
        });
    });

    document.querySelectorAll('.section-tab').forEach(button => {
        button.addEventListener('click', (e) => {
            appContainer.dataset.section = e.target.dataset.section;
            renderCourseDetail();
        });
    });

    if (currentSection === 'exercises') {
        document.getElementById('verify-button')?.addEventListener('click', verifyAnswers);
    }
    
    appContainer.classList.remove('opacity-0');
    appContainer.classList.add('fade-in');
};

/**
 * Genera el HTML para el formulario de ejercicios.
 */
const renderExercises = (exercises) => {
    if (exercises.length === 0) {
        return '<div class="text-center p-10 text-gray-500">No hay ejercicios disponibles para este nivel aún.</div>';
    }

    const exercisesHtml = exercises.map((item, index) => {
        const inputType = item.type === 'number' ? 'number' : 'text';
        return `
            <div class="mb-8 p-4 border rounded-lg shadow-sm bg-gray-50">
                <p class="text-lg font-medium text-gray-800 mb-3">${index + 1}. ${item.question}</p>
                <input type="${inputType}" id="answer-${index}" placeholder="Tu respuesta..." 
                       class="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900">
                <div id="feedback-${index}" class="mt-2 text-sm font-semibold"></div>
            </div>
        `;
    }).join('');

    return `
        <form id="exercises-form" class="space-y-6">
            ${exercisesHtml}
            <button type="button" id="verify-button" class="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors shadow-xl">
                Verificar Respuestas
            </button>
        </form>
        <div id="score-summary" class="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 hidden"></div>
    `;
};


// ====================================================================
// LÓGICA DE EJERCICIOS
// ====================================================================

/**
 * Procesa el formulario y verifica las respuestas de los ejercicios.
 */
const verifyAnswers = () => {
    if (!selectedCourse) return;

    const exercises = exercisesData[selectedCourse.id][selectedLevel] || [];
    let correctCount = 0;

    exercises.forEach((item, index) => {
        const inputElement = document.getElementById(`answer-${index}`);
        const feedbackElement = document.getElementById(`feedback-${index}`);
        
        if (!inputElement || !feedbackElement) return;

        const userAnswer = inputElement.value;
        const isCorrect = checkAnswer(userAnswer, item.answer, item.type);

        feedbackElement.classList.remove('text-green-600', 'text-red-600');
        
        if (isCorrect) {
            feedbackElement.textContent = "¡Correcto! ✅";
            feedbackElement.classList.add('text-green-600');
            correctCount++;
        } else {
            // Manejo de múltiples opciones de respuesta para mostrar la primera opción como 'la correcta'
            const answerToShow = String(item.answer).split('|')[0]; 
            feedbackElement.innerHTML = `Incorrecto. La respuesta correcta es: <span class="text-red-600">${answerToShow}</span> ❌`;
            feedbackElement.classList.add('text-red-600');
        }
    });

    // Mostrar resumen de puntuación
    const totalQuestions = exercises.length;
    const scoreSummary = document.getElementById('score-summary');
    if (scoreSummary) {
        scoreSummary.innerHTML = `
            <h3 class="text-xl font-bold text-blue-800">Resultado:</h3>
            <p class="text-lg text-gray-700">Obtuviste ${correctCount} de ${totalQuestions} preguntas correctas.</p>
            ${correctCount === totalQuestions 
                ? '<p class="text-green-600 font-bold mt-2">¡Felicitaciones! Has completado el nivel a la perfección. 🌟</p>'
                : ''}
        `;
        scoreSummary.classList.remove('hidden');
    }
    // Se ha eliminado la llamada a saveProgress( ... )
};

// ====================================================================
// INICIO DE LA APLICACIÓN
// ====================================================================

/**
 * Función principal para iniciar y renderizar la aplicación.
 */
const renderApp = () => {
    // Inicializar el contenedor si no existe
    if (!appContainer) {
        appContainer = document.getElementById('app-container');
    }
    
    // Si no hay curso seleccionado, mostrar la vista principal
    if (selectedCourse) {
        renderCourseDetail();
    } else {
        renderCourseCards();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Se ha eliminado la llamada a await initFirebase();
    
    // Configurar el botón de inicio
    document.getElementById('home-button').addEventListener('click', (e) => {
        e.preventDefault();
        selectedCourse = null;
        delete appContainer.dataset.section; // Limpiar la sección seleccionada
        renderApp();
    });
    
    // Renderizar la aplicación
    renderApp();
});
