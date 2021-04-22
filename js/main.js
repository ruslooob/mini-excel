/* 
	Как работает программа:
	  
	1. Рисование таблицы
	2. Добавляются обработчики событий mousedown для input-ов
		и mousedown для tdoby
			Обработчик событий для tbody нужен для того, чтобы 
			регистрировать начало выделения (оно произойдет,   
			когда пользователь зажмет ЛКМ по tbody). Он также запоминает, 
			на с какой ячейки пользователь начал выделение.
		Далее в дело вступают обработчики для input-ов
			Они "ловит" отпускание клавиши пользователя
			когда это случится, они запоминают input, на котором
			нажатие прекратилось
	3. Далее по 2 известным точкам, которые лежат на 
		диагонали прямоугольника строится сам прямоугольник выделения ячеек.
		При этом у нас может возникнуть 4 случая, в зависимост от какой вершины
		прямоугольника пользователь начнет выделение. 
		Чтобы не обрабатывать эти 4 случая приведем более неудобные случаи к
		более удобному. Наиболее удобен случай, когда пользователь начинает
		выделять с левого верхнего и до правого нижнего угла.
	3. После того, как пользователь выделит какую-то область,
		данные о ней попадут в специальную переменную - matricesInfo.
		В ней хранится информация о выделенных областях 
		(а именно координата левого верхнего угла, количество колонок и строк), 
		причем в ней не может хранится более 2 матриц (из-за их ненадобности).
	4. Во время того, как пользователь нажмет на одну из кнопок
		"Сложить", "Вычесть", "Умножить", "Детерменант" из matricesInfo
		достаются одна/две координаты матриц, даллее эти матрицы на основе  этих 
		координат созаются, ну и после необходимое действие выполняется.
	5. Когда пользователь нажимает на конопку "Очистить", все выделенная область
		будет закрашиваться в белый цвет. 
	
	P.S 1. В дальнейшем можно будет добавить изчезновение старых выделенных областей,
		 при условии, что сущесвтует 2 новых. Также можно добавить изменение
		 информации в matricies, если пользователь стер или подкорректировал 
		 какую-то из матриц.
		2. Еще из фич можно добавить инвертирование выделения, если пользователь
		 2 раза подняд делает одно и то же дейстие. Например, если он выделил область,
		 а затем еще раз выделил ее же, то вся эта выделенная область меняет свой цвет.
		3. Еще можно добавить разные цвета выделения. Например, если человек выделяет
		одну область, она подсвечивается сервым, другую - салатовым и т д.
		4. Можно еще подумать над пользовательским интерфейсом.
				Шорткаты, которые способны многократно облегчить работу
				Расположение кнопок
*/




var tbody = document.getElementsByClassName('main-table__body')[0];
/* Параметры таблицы */
var tableRows = 24; // 37
var tableCols = 19;
/* флаг для определения, 
	начала выделения ячеек пользователем  */
var isSelect = false;
/* Последняя нажатая клавиша */
var lastSelectedCell;

/* Границы выделенных ячеек
	для опрееления выделенной области
	достаточно 2 точек, 
	которые расположены по диагонали прямоугольника
*/
var firstSelectedCell;
var secondSelectedCell;
var indexFirstSelectedCell;
var indexSecondSelectedCell;
var clearOn = false;
// конструктор матриц 
function MatrixInfo() {
	// this.body = [];
	this.indexFirstSelectedCell = undefined;
	this.indexSecondSelectedCell = undefined;
	this.rows = undefined;
	this.cols = undefined;
}
// хранит матрицы
var matricesInfo = [];

/* создание таблицы*/
for (var i = 0; i < tableRows; i++) {
	var tr = document.createElement('tr');
	for (var j = 0; j < tableCols; j++) {
		var td = document.createElement('td');
		td.innerHTML = '<input type="text" class=\"input-text\">';
		tr.appendChild(td);
	}
	tbody.appendChild(tr);
}

var inputs = tbody.getElementsByClassName('input-text');


/* добавление всем input событий*/
for (var i = 0; i < inputs.length; i++) {
	/* смена цвета при выделении 1 ячейки */
	inputs[i].addEventListener('click', function (e) {
		if (lastSelectedCell) {
			lastSelectedCell.style.backgroundColor = 'white';
		}
		lastSelectedCell = e.target;
	});
	// валидация (можно вводить только цифры)

	inputs[i].addEventListener('keyup', function () {
		this.value = this.value.replace(/[^\d]/g, '');
	});


	/* нахождение второй ячейки
	активируется, когда пользователь отпускает ЛКМ 
	и когда пользователь начал выделение */
	inputs[i].addEventListener('mouseup', function (e) {
		// если выбрана и если левая кнопка
		if (isSelect && e.which == 1) {
			secondSelectedCell = e.target;
		}
		indexFirstSelectedCell = findCellIndex(firstSelectedCell);
		indexSecondSelectedCell = findCellIndex(secondSelectedCell);
		/* Для того, чтобы работало выделение справа снизу влево вверх */
		if (indexFirstSelectedCell > indexSecondSelectedCell) {
			[indexFirstSelectedCell, indexSecondSelectedCell] = swap(indexFirstSelectedCell, indexSecondSelectedCell);
		}
		/* Узнаем, с какого столбца было начато
		и закончено выделение  */
		var colFirst, colSecond;
		colFirst = indexFirstSelectedCell % tableCols;
		colSecond = indexSecondSelectedCell % tableCols;

		var rowFirst, rowSecond;
		rowFirst = Math.floor(indexFirstSelectedCell / tableCols);
		rowSecond = Math.floor(indexSecondSelectedCell / tableCols);



		/* если выделение происходит справа налево 
			 превращаем его как будто выделение происходило слева направо
			 (нам известны правая верхняя и левая нижняя, но намного удобнее, 
			 чтобы были известны левая верхняя и правая нижняя ячейки)
		*/


		/* если выделение происходит с НЕ левого верхнего угла в правый нижний 
		или НЕ с правого нижнего в левый верхний (этот случай уже обрабатывается по дефолту) */
		// проверить на избыточность условия << || >>
		if (!(colFirst < colSecond) && (rowFirst < rowSecond) ||
			!(colFirst > colSecond) && (rowFirst > rowSecond)) {

			var selectedRows = rowSecond - rowFirst;
			indexFirstSelectedCell += selectedRows * tableCols;
			indexSecondSelectedCell -= selectedRows * tableCols;
			if (indexFirstSelectedCell > indexSecondSelectedCell) {
				[indexFirstSelectedCell, indexSecondSelectedCell] = swap(indexFirstSelectedCell, indexSecondSelectedCell);
			}
			if (colFirst > colSecond) {
				[colFirst, colSecond] = swap(colFirst, colSecond);
			}
		}
		var cellBackColor = (clearOn == false) ? "#c0c0c0	" : "white";

		for (var i = indexFirstSelectedCell; i < indexSecondSelectedCell + 1; i++) {
			var remainsI = i % tableCols;
			if (remainsI >= colFirst && remainsI <= colSecond) {
				inputs[i].style.backgroundColor = cellBackColor;
				if (clearOn) {
					inputs[i].value = "";
				}
			}

		}
		// если не включен режим очищения
		// то добавляем информацию о матрицах 
		// всего хранится может не боле 2 матриц
		if (!clearOn) {
			if (matricesInfo.length == 2) {
				// стираем старое выделение
				var start = matricesInfo[0].indexFirstSelectedCell;
				var end = matricesInfo[0].indexSecondSelectedCell;
				for (var i = start; i <= end; i += tableCols) {
					for (var j = 0; j < matricesInfo[0].cols; j++) {
						var start2 = matricesInfo[1].indexFirstSelectedCell;
						var end2 = matricesInfo[1].indexSecondSelectedCell;
						console.log(start2);
						console.log(end2);
						// если нет пересечения
						// if (((i + j) < start2) || ((i + j) > end2)) {
						inputs[i + j].style.backgroundColor = 'white';
						// }
					}
				}
				// удаляем старое выделение из инфор-матрицы
				matricesInfo.shift();
			}
			var matrix = new MatrixInfo();
			matrix.rows = rowSecond - rowFirst + 1;
			matrix.cols = colSecond - colFirst + 1;
			matrix.indexFirstSelectedCell = indexFirstSelectedCell;
			matrix.indexSecondSelectedCell = indexSecondSelectedCell;
			matricesInfo.push(matrix);
		}


		isSelect = false;
	});
}

/* вычистелние начального пложения курсора */
tbody.addEventListener('mousedown', function (e) {
	// если нажата левая кнопка мыши
	if (e.which == 1) {
		isSelect = true;
		firstSelectedCell = e.target;
	}
});


/* Пытается найти ячеку во всех input 
	Если это удается, возвращает индекс вхождения
	иначе возвращает -1
*/
function findCellIndex(cell) {
	for (var i = 0; i < inputs.length; i++) {
		if (inputs[i] == cell) return i;
	}
	return -1;
}


document.querySelector('.tools__sum-btn').addEventListener('click', function () {
	var A = createMatrix(0);
	var B = createMatrix(1);


	if (!correctSizes(A, B, '+')) {
		printError();
		return;
	}
	// C будет соразмерна с A && B
	var C = [];


	var aInfo = matricesInfo[0];
	var bInfo = matricesInfo[1];

	// Создание пустого двумерного массива "C"
	for (var i = 0; i < aInfo.rows; i++) {
		C[i] = [];
	}
	// нужно написать функцию, которая будет складывать матрицы
	for (var i = 0; i < aInfo.rows; i++) {
		for (var j = 0; j < aInfo.cols; j++) {
			C[i][j] = Number(A[i][j]) + Number(B[i][j]);
		}
	}
	/* Запись массива в матрицу ответов*/
	/* 100% код можно сократить в несколько раз */
	printAnswer(C);
});
/* функция очень простая, но написана ужасно */
function correctSizes(A = undefined, B = undefined, action = 'none') {
	switch (action) {
		case '+':
		case '-':
			if (A == undefined || B == undefined)
				return false;
			else if (A.length == B.length && A[0].length == B[0].length)
				return true;
			return false;
		case '*':
			if (A == undefined || B == undefined)
				return false;
			// если число столбцов в 1 равно числу строк во 2
			else if (A[0].length == B.length)
				return true;
			return false;
		case 'det':
			if (A == undefined)
				return false;
			else if (A.length == A[0].length)
				return true;
			return false;
	}
}

document.querySelector('.tools__sub-btn').addEventListener('click', function () {
	var A = createMatrix(0);
	var B = createMatrix(1);
	// C будет соразмерна с A && B
	var C = [];

	if (!correctSizes(A, B, '-')) {
		printError();
		return;
	}

	var aInfo = matricesInfo[0];
	var bInfo = matricesInfo[1];

	// Создание пустого массива "C"
	// можно переместить в отдельную функцию
	for (var i = 0; i < aInfo.rows; i++) {
		C[i] = [];
	}
	// расчет матрицы C
	// нужно написать отдельную ф-цию, которая будет вычитать матрицы
	for (var i = 0; i < aInfo.rows; i++) {
		for (var j = 0; j < aInfo.cols; j++) {
			C[i][j] = A[i][j] - B[i][j];
		}
	}
	printAnswer(C);
});

document.querySelector('.tools__multiply-btn').addEventListener('click', function () {
	var A = createMatrix(0);
	var B = createMatrix(1);
	// нужно проверить на равенство числа 
	// столбцов в А равно числу строк в В
	var C = [];

	if (!correctSizes(A, B, '*')) {
		printError();
		return;
	}
	printAnswer(multiplyMatrix(A, B));
});

document.querySelector('.tools__determinant-btn').addEventListener('click', function () {
	// детерменант будет расчитываться
	// по последней выделенной матрице 
	var A = createMatrix(1);
	if (!correctSizes(A, undefined, 'det')) {
		printError();
		return;
	}
	// в двойные скобки, потому что ф-кция
	// printAnswer принимает на вход двумерный массив
	printAnswer([[determinant(A)]]);
});


/* скопировано с 
	http://mathhelpplanet.com/static.php?p=javascript-operatsii-nad-matritsami */
// Используется алгоритм Барейса, сложность O(n^3)
function determinant(A) {
	var N = A.length, B = [], denom = 1, exchanges = 0;
	for (var i = 0; i < N; ++i) {
		B[i] = [];
		for (var j = 0; j < N; ++j)
			B[i][j] = A[i][j];
	}
	for (var i = 0; i < N - 1; ++i) {
		var maxN = i, maxValue = Math.abs(B[i][i]);
		for (var j = i + 1; j < N; ++j) {
			var value = Math.abs(B[j][i]);
			if (value > maxValue) {
				maxN = j;
				maxValue = value;
			}
		}
		if (maxN > i) {
			var temp = B[i];
			B[i] = B[maxN];
			B[maxN] = temp;
			++exchanges;
		}
		else {
			if (maxValue == 0)
				return maxValue;
		}
		var value1 = B[i][i];
		for (var j = i + 1; j < N; ++j) {
			var value2 = B[j][i];
			B[j][i] = 0;
			for (var k = i + 1; k < N; ++k)
				B[j][k] = (B[j][k] * value1 - B[i][k] * value2) / denom;
		}
		denom = value1;
	}
	if (exchanges % 2)
		return -B[N - 1][N - 1];
	else
		return B[N - 1][N - 1];
}
/* */
function multiplyMatrix(A, B) {
	var rowsA = A.length, colsA = A[0].length,
		rowsB = B.length, colsB = B[0].length,
		C = [];
	if (colsA != rowsB) return false;
	for (var i = 0; i < rowsA; i++) C[i] = [];
	for (var k = 0; k < colsB; k++) {
		for (var i = 0; i < rowsA; i++) {
			var t = 0;
			for (var j = 0; j < rowsB; j++) t += A[i][j] * B[j][k];
			C[i][k] = t;
		}
	}
	return C;
}


function createMatrix(index) {
	var matrix = [];

	var start = matricesInfo[index].indexFirstSelectedCell;
	var end = matricesInfo[index].indexSecondSelectedCell;

	// k - номер строки в матрице
	for (var i = start, k = 0; i <= end; i += tableCols, k++) {
		matrix.push([]);
		for (var j = 0; j < matricesInfo[index].cols; j++) {
			matrix[k][j] = Number(inputs[i + j].value);
		}
	}
	return matrix;
}

/* цвет кнопок по-умолчанию */
var btnDefaultColor = '#217346';
/* tools__clear-btn:click */
document.querySelector('.tools__clear-btn').addEventListener('click', function () {
	if (!clearOn) {
		this.style.backgroundColor = 'white';
		this.style.color = btnDefaultColor;
		clearOn = true;
	} else {
		this.style.backgroundColor = btnDefaultColor;
		this.style.color = 'white';
		clearOn = false;
	}
});


function printAnswer(C) {
	var answerTableBody = document.querySelector('.answer-table__body');
	if (answerTableBody) {
		// удаляем старый, потом создаем новый
		answerTableBody.remove();
	}
	answerTableBody = document.createElement('tbody');
	answerTableBody.className = 'answer-table__body';
	// cоздание таблицы ответов
	for (var i = 0; i < C.length; i++) {
		var tr = document.createElement('tr');
		for (var j = 0; j < tableCols; j++) {
			var td = document.createElement('td');
			td.innerHTML = '<input type="text" class=\"input-text\">';
			tr.appendChild(td);
		}
		answerTableBody.appendChild(tr);
	}
	document.querySelector('.answer-table').appendChild(answerTableBody);
	// показать разделитель
	var separator = document.querySelector('.separator');
	separator.style.display = 'block';

	// записываем массив "С" в таблицу ответов 
	var answerInputs = document.querySelectorAll('.answer-table__body input[class="input-text"]');
	for (var i = 0; i < C.length; i++) {
		for (var j = 0; j < C[i].length; j++) {
			answerInputs[i * tableCols + j].value = C[i][j];
		}
	}

	window.scrollBy(0, 100);
}

function printError() {
	var answerTableBody = document.querySelector('.answer-table__body');
	if (answerTableBody) {
		// удаляем старый, потом создаем новый
		answerTableBody.remove();
	}
	// создаем tbody
	answerTableBody = document.createElement('tbody');
	answerTableBody.className = 'answer-table__body';
	answerTableBody.innerHTML = "<span class=\"error-text\">Проверьте правильность введенных данных!<span>";
	document.querySelector('.answer-table').appendChild(answerTableBody);
	var errorText = document.querySelector('.error-text');
	errorText.style.display = "block";
	errorText.style.margin = "10px";
	// red orange
	errorText.style.color = "#ff3f34";
}

function swap(a, b) {
	return [b, a];
}
// отключение контекстного меню
document.oncontextmenu = function () { return false; };