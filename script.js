document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('root');
    if (!root) { console.error('Root element not found!'); return; }

    let students = [], chartInfo = { schoolYear: '2025', grade: '2', semester: '1', subject: '', teacher: '' }, seatingGrid = null, error = '', fileName = '', logo = null;

    function render() {
        root.innerHTML = `<main><header><h1>랜덤 좌석표 생성기</h1><p>학생 명렬표(CSV)를 업로드하고 자리 배치를 생성하세요.</p></header><div class="grid"><div class="lg:col-span-1">${Controls()}</div><div class="lg:col-span-2 chart-display">${ChartDisplay()}</div></div></main><footer>© 2025 Wonmook High School. All Rights Reserved.</footer>`;
        addEventListeners();
    }

    function Controls() {
        return `<div class="controls space-y-6"><h2>설정</h2><div class="space-y-4"><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;"><div class="input-field"><label for="schoolYear">학년도</label><input type="text" id="schoolYear" name="schoolYear" value="${chartInfo.schoolYear}"></div><div class="input-field"><label for="grade">학년</label><input type="text" id="grade" name="grade" value="${chartInfo.grade}"></div></div><div class="input-field"><label for="semester">학기</label><input type="text" id="semester" name="semester" value="${chartInfo.semester}"></div><div class="input-field"><label for="subject">선택과목명 (학급명)</label><input type="text" id="subject" name="subject" value="${chartInfo.subject}"></div><div class="input-field"><label for="teacher">담당교사명</label><input type="text" id="teacher" name="teacher" value="${chartInfo.teacher}"></div></div><div class="space-y-4"><div><label>학생 명렬표 (CSV)</label><input type="file" id="file-input" class="hidden" accept=".csv"><button type="button" id="file-button" class="button"><span>파일 선택</span></button>${fileName ? `<p class="file-info">선택된 파일: ${fileName}</p>` : ''}${error ? `<p class="error-message">${error}</p>` : ''}</div><div><label>학교 로고 (선택)</label><input type="file" id="logo-input" class="hidden" accept="image/*"><button type="button" id="logo-button" class="button"><span>로고 업로드</span></button></div></div><div style="border-top: 1px solid #e2e8f0; padding-top: 1.5rem;" class="space-y-4"><button type="button" id="randomize-button" class="button primary-button" ${students.length === 0 ? 'disabled' : ''}><span>자리 배치</span></button><button type="button" id="print-button" class="button" ${!seatingGrid ? 'disabled' : ''}><span>인쇄 및 PDF로 저장</span></button></div></div>`;
    }

    function ChartDisplay() {
        if (!seatingGrid) { return `<div class="text-center chart-placeholder"><h3>좌석표가 여기에 표시됩니다.</h3><p>정보를 입력하고 '자리 배치' 버튼을 누르세요.</p></div>`; }
        return `<div class="seating-chart-container">${SeatingChart('student-chart', '좌석표 (학생 시점)', seatingGrid, true)}${SeatingChart('teacher-chart', '좌석표 (교사 시점)', seatingGrid, false)}</div>`;
    }

    function SeatingChart(id, title, grid, isStudentView) {
        const displayGrid = isStudentView ? [...grid].reverse() : grid.map(row => [...row].reverse());
        const getSeatNumber = (r, c) => isStudentView ? (r * 6 + c + 1) : ((4 - r) * 6 + (5 - c) + 1);
        // ✨ 학번(student-id)과 이름(student-name)의 순서를 변경했습니다.
        const gridHtml = displayGrid.map((row, r) => row.map((student, c) => `<div class="student-card-container"><div class="student-card"><div class="seat-number">${getSeatNumber(r, c)}</div>${student ? `<div class="student-info"><p class="student-id">${student.studentId}</p><p class="student-name">${student.name}</p></div>` : `<div class="student-info"></div>`}</div></div>`).join('')).join('');

        return `<div id="${id}" class="seating-chart"><div class="seating-chart-content"><h2>${title}</h2><p class="chart-info">${chartInfo.schoolYear}학년도 ${chartInfo.semester}학기 ${chartInfo.grade}학년</p><div class="chart-details"><p class="subject">과목명: ${chartInfo.subject}</p><p class="teacher">담당교사명: ${chartInfo.teacher}</p></div><div class="seating-grid-wrapper">${isStudentView ? `<div class="teacher-desk"><div class="teacher-desk-box">교탁</div></div>` : ''}<div style="flex-grow: 1; display: flex; flex-direction: column;">${logo ? `<div class="logo-container"><img src="${logo}" alt="학교 로고"></div>` : ''}<div class="seating-grid">${gridHtml}</div></div>${!isStudentView ? `<div class="teacher-desk" style="margin-top: auto;"><div class="teacher-desk-box">교탁</div></div>` : ''}</div></div></div>`;
    }
    
    function handleInfoChange(e) { chartInfo[e.target.name] = e.target.value; if (seatingGrid) render(); }
    function handleFileChange(e) {
        const file = e.target.files?.[0]; if (!file) return;
        if (file.type !== 'text/csv') { error = 'CSV 파일만 업로드할 수 있습니다.'; fileName = ''; students = []; render(); return; }
        fileName = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const rows = event.target.result.split('\n').map(row => row.trim()).filter(row => row);
                const header = rows[0].split(',').map(h => h.trim());
                if (!header.includes('학번') || !header.includes('이름')) throw new Error('CSV 파일에 "학번"과 "이름" 열이 포함되어야 합니다.');
                const studentIdIndex = header.indexOf('학번');
                const nameIndex = header.indexOf('이름');
                students = rows.slice(1).map(row => { const values = row.split(','); return { studentId: values[studentIdIndex]?.trim() || '', name: values[nameIndex]?.trim() || '' }; }).filter(s => s.studentId && s.name);
                if (students.length === 0) throw new Error('학생 데이터를 파싱할 수 없습니다.');
                error = '';
            } catch (err) { error = err.message; students = []; fileName = ''; } finally { render(); }
        };
        reader.onerror = () => { error = '파일 읽기 오류'; students = []; fileName = ''; render(); };
        reader.readAsText(file, 'UTF-8');
    }
    function handleLogoChange(e) {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => { logo = reader.result; if (seatingGrid) render(); };
            reader.readAsDataURL(file);
        } else { logo = null; if (seatingGrid) render(); }
    }
    function handleRandomize() {
        if (students.length === 0) { error = '먼저 학생 명렬표를 업로드해주세요.'; render(); return; }
        error = '';
        const shuffled = [...students].sort(() => Math.random() - 0.5);
        const grid = Array(5).fill(null).map(() => Array(6).fill(null));
        let index = 0;
        for (let r = 4; r >= 0; r--) { for (let c = 0; c < 6; c++) { if (index < shuffled.length) { grid[r][c] = shuffled[index++]; } } }
        seatingGrid = grid;
        render();
    }

    function addEventListeners() {
        document.getElementById('schoolYear').addEventListener('input', handleInfoChange);
        document.getElementById('grade').addEventListener('input', handleInfoChange);
        document.getElementById('semester').addEventListener('input', handleInfoChange);
        document.getElementById('subject').addEventListener('input', handleInfoChange);
        document.getElementById('teacher').addEventListener('input', handleInfoChange);
        document.getElementById('file-button').addEventListener('click', () => document.getElementById('file-input').click());
        document.getElementById('file-input').addEventListener('change', handleFileChange);
        document.getElementById('logo-button').addEventListener('click', () => document.getElementById('logo-input').click());
        document.getElementById('logo-input').addEventListener('change', handleLogoChange);
        document.getElementById('randomize-button').addEventListener('click', handleRandomize);
        document.getElementById('print-button').addEventListener('click', () => window.print());
    }

    render();
});