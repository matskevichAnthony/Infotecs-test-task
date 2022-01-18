// импортирование данных
import { data } from "./data.js";

// инициализация данных
const userData = data();

//state программы
const state = {
    tableData: [...userData], // массив, который содержит все элементы
    currentTable: [], // массив, который содержит текущие элементы (10 элементов)
    hiddenPages: [], // спрятанные страницы
    page: 1, // текущая страница
    rows: 10, // колличество строк в таблице
};

// функция, которая рассчитывает колличество страниц и возвращает объект {массив объектов обрезанный, колличество страниц}
const tablePagination = (querySet, page, rows) => {
    //trimstart и trimend нужны для slice, чтобы вырезать нужное колличество из массива
    const trimStart = (page - 1) * rows;
    const trimeEnd = trimStart + rows;
    const trimmedData = querySet.slice(trimStart, trimeEnd);
    const pages = Math.ceil(querySet.length / rows);

    return {
        querySet: trimmedData,
        pages: pages,
    };
};

// функция расчета колличества строк в about и изменение размера строки до 2
const calcLinesNumber = () => {
    const aboutSection = document.querySelectorAll(".cell[t-header='about']");
    let index = 0;
    for (let item of aboutSection) {
        let currentPerson = state.currentTable[index];
        const text = currentPerson.about;
        const span = document.createElement("span");
        span.textContent = text;
        item.innerHTML = "";
        item.appendChild(span);
        // в divideNumber рассчитано число символов, которое должно быть, чтобы было именно 2 строки
        const divideNumber = Math.ceil(
            (currentPerson.about.split("").length +
                currentPerson.about.split("").length / 2) /
            span.getClientRects().length
        );
        span.textContent = truncateString(currentPerson.about, divideNumber);
        index++;
    }
};

// функция для обрезания строки (используется для about)
const truncateString = (str, number) => {
    return str.length > number ? str.slice(0, number) + "..." : str;
};

//функция, которая рисует необходимое колличество кнопок пагинации
const tablePaginationButtons = (pages) => {
    const paginationWrapper = document.querySelector(".pagination-wrapper");
    const tableBody = document.querySelector("tbody");
    paginationWrapper.innerHTML = "";
    for (let page = 1; page <= pages; page++) {
        paginationWrapper.innerHTML += `<button value=${page} class="page-button">${page}</button`;
    }
    const buttons = document.querySelectorAll(".page-button");
    for (let item of buttons) {
        item.addEventListener("click", function () {
            state.page = item.value;
            tableBody.innerHTML = "";
            createTable(state.tableData);
            visibilityHandler();
        });
    }
};
// функция сортировки
const sortHandler = (e) => {
    // аттрибут названия колонки
    const column = e.target.getAttribute("data-column");
    // аттрибут последовательности
    const order = e.target.getAttribute("data-order");
    // сохраняется в переменнную для того чтобы менять потом стрелку desc asc
    let tableHeader = e.target.innerHTML.substring(
        0,
        e.target.innerText.length - 1
    );
    // если по убыванию (desc) else по возрастанию
    if (order === "desc") {
        e.target.setAttribute("data-order", "asc");
        // метод сортировки
        const sortedArray2 = state.tableData.sort((a, b) => {
            if (column === "firstName" || column === "lastName") {
                // localcompare нужен для того чтобы сравнивать колонки, которые могут иметь одинаковое значение
                return (
                    a.name[column] - b.name[column] ||
                    a.name[column].localeCompare(b.name[column])
                );
            } else {
                return a[column] - b[column] || a[column].localeCompare(b[column]);
            }
        });
        tableHeader += "▲";
        // изменение html у хэдэра по которому был совершен клик
        e.target.innerHTML = tableHeader;
        // мутация currentTable на отсортированный
        state.currentTable = sortedArray2;
        // перерисовка таблицы
        createTable(state.currentTable);
    } else {
        e.target.setAttribute("data-order", "desc");
        const sortedArray2 = state.tableData.sort((a, b) => {
            if (column === "firstName" || column === "lastName") {
                return (
                    b.name[column] - a.name[column] ||
                    b.name[column].localeCompare(a.name[column])
                );
            } else {
                return b[column] - a[column] || b[column].localeCompare(a[column]);
            }
        });
        tableHeader += "▼";
        e.target.innerHTML = tableHeader;
        state.currentTable = sortedArray2;
        createTable(state.currentTable);
    }
};
// функция, которая выполняет изменения данных выбранного person из массива
const submitHandler = (person) => {
    const changeWindow = document.querySelector(".change-info-window");
    const inputWrapper = document.querySelector(".info-window-input-wrapper");
    changeWindow.classList.remove("active");
    changeWindow.setAttribute("data-visibility", "hidden");
    // сохранение инпутов в переменные, чтобы потом взять их значение
    const firstName = document.querySelector("#firstName");
    const lastName = document.querySelector("#lastName");
    const about = document.querySelector("#about");
    const eyecolor = document.querySelector("#eyeColor");
    // поиск person, которого нужно изменить, возвращает индекс
    const userId = state.tableData.findIndex((e) => {
        return e.id === person.id;
    });
    // создание нового объекта человека с новыми обновленными данными
    const newUser = {
        ...person,
        name: {
            ...person.name,
            firstName: firstName.value,
            lastName: lastName.value,
        },
        about: about.value,
        eyeColor: eyecolor.value,
    };
    inputWrapper.innerHTML = "";
    // мутация массива в стейте
    state.tableData[userId] = newUser;
    // вызов функции перерисовки таблицы
    createTable(state.tableData);
};

// функция скрытия колонок
const visibilityHandler = (e = "reset") => {
    // поиск колонок по аттрибуту
    if (e === "reset") {
        state.hiddenPages.forEach((elem) => {
            const header = document.querySelector(`.table-header-${elem}`);
            const arrow = header.getAttribute("data-order") === "desc" ? "▼" : "▲";
            header.classList.remove("active");
            header.style.pointerEvents = "all";
            header.innerHTML = header.getAttribute("data-column") + arrow;
        });
    } else {
        const columns = document.querySelectorAll(`[t-header="${e}"]`);
        // сохранение нужного хэдэра
        const header = document.querySelector(`.table-header-${e}`);
        // возвращает символ, в зависимости от аттрибута data-order
        const arrow = header.getAttribute("data-order") === "desc" ? "▼" : "▲";
        if (header.classList.contains("active") && state.hiddenPages.includes(e)) {
            header.classList.remove("active");
            header.style.pointerEvents = "all";
            header.innerHTML = header.getAttribute("data-column") + arrow;
            state.hiddenPages = state.hiddenPages.filter((elem) => {
                return elem !== e;
            });
        } else {
            state.hiddenPages.push(e);
            header.classList.add("active");
            header.style.pointerEvents = "none";
            header.innerHTML = "↖";
        }
        columns.forEach((elem) => {
            elem.classList.contains("active")
                ? elem.classList.remove("active")
                : elem.classList.add("active");
        });
    }
};
// функция отображения окна для изменения данных о person, принимает person(с id и phone)
// и transformedPerson без id и phone
// оригинальный person нужен для передачи в submitHandler, трансформированный для
// отображения информации в инпутах
const showChangeDataWindow = (person, transformedPerson) => {
    const inputWrapper = document.querySelector(".info-window-input-wrapper");
    const changeWindow = document.querySelector(".change-info-window");
    const submitButton = document.createElement("button");
    // атрибут, отвечающий за то, если окно спрятано или нет
    const isHidden = changeWindow.getAttribute("data-visibility") === "hidden";
    submitButton.classList.add("change-button");
    submitButton.innerText = "submit";
    // передача информации об оригинальном person в submitHandler
    submitButton.addEventListener("click", () => submitHandler(person));
    // проверка, если аттрибут isHidden === true, то тогда покажи окошко
    // else спрятать
    if (isHidden) {
        changeWindow.classList.add("active");
        changeWindow.setAttribute("data-visibility", "");
        Object.values(transformedPerson).forEach((elem, index) => {
            const input = document.createElement("input");
            input.classList.add("change-input");
            input.value = elem;
            input.id = Object.keys(transformedPerson)[index];
            inputWrapper.appendChild(input);
        });
        inputWrapper.appendChild(submitButton);
    } else {
        inputWrapper.innerHTML = "";
        changeWindow.setAttribute("data-visibility", "hidden");
        changeWindow.classList.remove("active");
    };
};

// функция для трасформирования массива объектов
// она принимает массив и возвращает новый массив объектов без id и phone
// и заменяет колонку name на отдельные firstName и LastName
// * функция нужна для упрощенной работы с html
const transformObject = (peopleArray) => {
    if (peopleArray[0].name) {
        const copy = [...peopleArray];
        //new Array содержит объекты без id и phone
        const newArray = copy.map((elem) => {
            if (elem.id || elem.phone) {
                const objCopy = { ...elem };
                delete objCopy.id;
                delete objCopy.phone;
                return objCopy;
            } else {
                return elem;
            }
        });
        const updatedArray = [];
        // перебор массива и замена поля name на FirstName и LastName
        newArray.forEach((item) => {
            Object.values(item).forEach((name) => {
                if (typeof name === "object") {
                    const newElem = { ...name };
                    const updated = Object.assign(newElem, item);
                    delete updated.name;
                    updatedArray.push(updated);
                }
            });
        });
        return updatedArray;
    } else {
        return peopleArray;
    }
};

// функция для отрисовки колонок таблицы (headers) и кнопок контроля для видимости колонок
// принимает в себя массив колонок
const createHeaders = (tableHeaders) => {
    const tableHeader = document.querySelector("#table-header");
    // controlsWindow позволяет скрывать и показывать колонки
    const controlsWindow = document.querySelector(".button-wrapper");

    tableHeaders.forEach((elem) => {
        // заполнение controls window
        const button = document.createElement("button");
        button.addEventListener("click", () => visibilityHandler(elem));
        button.innerText = elem;
        button.classList.add("show-hide-button");
        controlsWindow.appendChild(button);
        // заполнение хэдэров таблицы
        const cell = document.createElement("td");
        cell.classList.add(`table-header-${elem}`);
        cell.appendChild(document.createTextNode(elem + "▼"));
        cell.setAttribute("data-column", elem);
        cell.setAttribute("data-order", "desc");
        cell.addEventListener("click", sortHandler);
        tableHeader.appendChild(cell);
    });
};

//функция отрисовки таблицы
const createTable = (data) => {
    console.log(state.tableData);
    const paginatedObject = tablePagination(data, state.page, state.rows);
    const paginatedData = paginatedObject.querySet;
    // данные таблицы, показанные на данный момент юзеру
    state.currentTable = paginatedData;
    // удаление всех предыдущих rows таблицы
    const tableBody = document.querySelector("tbody");
    tableBody.innerHTML = "";
    // создание массива обновленных объектов без id и phone для отрисовки html
    const transformedData = transformObject(paginatedData);
    // сохранение названия колонок обновленного объекта в константу tableHeaders
    const tableHeaders = Object.keys(transformedData[0]);

    // если колличество хэдэров таблицы меньше чем в константе tableHeaders, то вызывается функция создания хэдэров
    Array.from(document.querySelector("#table-header").children).length <
        tableHeaders.length && createHeaders(tableHeaders);

    // перебор полученного массива оригинального, включая id и phone
    paginatedData.forEach((person, index) => {
        // трансформированный person без id и phone для использования в html ячейках
        const transformedPerson = transformedData[index];
        const row = document.createElement("tr");
        tableBody.appendChild(row);
        // forEach по entries трансформированного person, для забивания информации о нем в html ячейки
        Object.entries(transformedPerson).forEach((info) => {
            const cell = document.createElement("td");
            cell.setAttribute("t-header", info[0]);
            cell.classList.add("cell");
            // проверка, если значение является цветом глаз -> создает кружок с цветом
            if (info[1] === person.eyeColor) {
                const color = document.createElement("div");
                color.classList.add("color");
                color.style.background = info[1];
                cell.style.display = "flex";
                cell.style.flexDirection = "row-reverse";
                cell.style.gap = "1rem";
                cell.appendChild(color);
            }

            cell.appendChild(document.createTextNode(info[1]));
            row.appendChild(cell);
            // listener для вызова окна изменения данных
            cell.addEventListener("click", () =>
                showChangeDataWindow(person, transformedPerson)
            );
        });
    });
    tablePaginationButtons(paginatedObject.pages);
    calcLinesNumber();
};

// вызов функции создания таблицы
createTable(state.tableData);
// на изменение размера окна вызывается функция для расчета размера about до 2 строк
window.onresize = calcLinesNumber;
