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
*/


var tbody = document.getElementsByClassName('table__body')[0];
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
		// var input = document.createElement('input');
		td.innerHTML = '<input type="text" class=\"input-text\">';
		// td.appendChild(input);
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
	/* нахождение второй ячейки
	активируется, когда пользователь отпускает ЛКМ 
	и когда пользователь начал выделение */
	// mousemove mouseup
	inputs[i].addEventListener('mouseup', function (e) {
		if (isSelect) {
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

			}

		}
		// если не включен режим очищения
		// то добавляем информацию о матрицах 
		// всего хранится может не боле 2 матриц
		if (!clearOn) {
			if (matricesInfo.length == 2) {
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
	isSelect = true;
	firstSelectedCell = e.target;
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
	// C будет соразмерна с A && B
	var C = [];


	var aInfo = matricesInfo[0];
	var bInfo = matricesInfo[1];

	// Создание пустого массива "C"
	for (var i = 0; i < aInfo.rows; i++) {
		C[i] = [];
	}

	for (var i = 0; i < aInfo.rows; i++) {
		for (var j = 0; j < aInfo.cols; j++) {
			C[i][j] = Number(A[i][j]) + Number(B[i][j]);
		}
	}

	console.log(C);
});

document.querySelector('.tools__sub-btn').addEventListener('click', function () {
	var A = createMatrix(0);
	var B = createMatrix(1);
	// C будет соразмерна с A && B
	var C = [];


	var aInfo = matricesInfo[0];
	var bInfo = matricesInfo[1];

	// Создание пустого массива "C"
	for (var i = 0; i < aInfo.rows; i++) {
		C[i] = [];
	}

	for (var i = 0; i < aInfo.rows; i++) {
		for (var j = 0; j < aInfo.cols; j++) {
			C[i][j] = Number(A[i][j]) - Number(B[i][j]);
		}
	}

	console.log(C);
});

document.querySelector('.tools__multiply-btn').addEventListener('click', function () {

});

document.querySelector('.tools__determenant-btn').addEventListener('click', function () {

});

function createMatrix(index) {
	var matrix = [[]];

	var start = matricesInfo[index].indexFirstSelectedCell;
	var end = matricesInfo[index].indexSecondSelectedCell;

	// k - номер строки в матрице
	for (var i = start, k = 0; i <= end; i += tableCols, k++) {
		for (var j = 0; j < matricesInfo[index].cols; j++) {
			matrix[k][j] = inputs[i + j].value;
		}
		matrix.push([]);
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

function swap(a, b) {
	return [b, a];
}
