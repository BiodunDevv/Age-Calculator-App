const day = document.getElementById("day");
const month = document.getElementById("month");
const year = document.getElementById("year");
const btn = document.getElementById("btn");
const ageYears = document.getElementById("age-years");
const ageMonths = document.getElementById("age-months");
const ageDays = document.getElementById("age-days");

btn.addEventListener("click", () => {
  const inputedDay = parseInt(day.value);
  const inputedMonth = parseInt(month.value);
  const inputedYear = parseInt(year.value);

  if (!inputedDay || !inputedMonth || !inputedYear) {
    showErrorModal();
    return;
  }

  const today = new Date();
  const birthDate = new Date(inputedYear, inputedMonth - 1, inputedDay);

  let ageYearsValue = today.getFullYear() - birthDate.getFullYear();
  let ageMonthsValue = today.getMonth() - birthDate.getMonth();
  let ageDaysValue = today.getDate() - birthDate.getDate();

  if (ageMonthsValue < 0) {
    ageYearsValue--;
    ageMonthsValue += 12;
  }

  if (ageDaysValue < 0) {
    ageMonthsValue--;
    if (ageMonthsValue < 0) {
      ageYearsValue--;
      ageMonthsValue += 11;
    }
    const previousMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    ageDaysValue += previousMonth.getDate();
  }

  ageYears.innerText = ageYearsValue;
  ageMonths.innerText = ageMonthsValue;
  ageDays.innerText = ageDaysValue;

  day.value = '';
  month.value = '';
  year.value = '';
});

function showErrorModal() {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });
  Toast.fire({
    icon: "error",
    title: "Please fill all the fields",
  });
}
