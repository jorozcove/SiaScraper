// Copyright (c) 2022 Sia Scraper | Juan Orozco

//date functions
function padTo2Digits(num) {
  return num.toString().padStart(2, "0")
}

function formatDate(date) {
  return (
    [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join("-") +
    " " +
    [padTo2Digits(date.getHours()), padTo2Digits(date.getMinutes())].join(":")
  )
}

function getCourseData() {
  //get all the info of the current course and return it into a json object

  var courseObj = {}
  var courseName = document.getElementsByTagName("h2")[0].textContent
  var credits = document
    .getElementsByClassName("af_panelBox_center p_AFCore p_AFDefault")[0]
    .getElementsByClassName("af_panelGroupLayout")[4]
    .textContent.split(":")[1]

  // console.log(Number.parseInt(cupos.slice(cupos.indexOf(":")+1, cupos.length)))
  var groupList = []
  courseObj["nombreAsignatura"] = courseName
  courseObj["cuposDisponibles"] = 0
  courseObj["fechaObtencion"] = formatDate(new Date())
  courseObj["grupos"] = groupList
  courseObj["creditos"] = credits
    ? Number.parseInt(credits.slice(credits.indexOf(":") + 1, credits.length))
    : 0
  var groups = document.querySelectorAll(".borde.salto:not(.ficha-docente)") //get groups and avoid "Contenido de asignatura"
  //groups = [].slice.call(groups).slice(0,-1) // TEMPORAL FIX (avoid prerrequisites)
  for (var group of groups) {
    if (group.getElementsByClassName("margin-t")[1] == undefined) {
      break
    } //avoid prerrequisites or correquisites info

    var groupObj = {}
    groupObj["nombreGrupo"] = group.getElementsByClassName(
      "af_showDetailHeader_title-text0 "
    )[0].textContent
    var groupData = group.getElementsByClassName("margin-t")[1].children
    groupObj["profesor"] = groupData[0].textContent.split(": ")[1]
    groupObj["facultad"] = groupData[1].textContent.split(": ")[1]
    groupObj["nombre"] = courseName
    var shedules = []
    var sheduleData = []
    var shedule = {}
    var sData = groupData[2].getElementsByClassName("af_panelGroupLayout")[0]
    if (sData.childElementCount > 0) {
      sData = [].slice.call(sData.children[0].children).slice(2)
      for (let s of sData) {
        sheduleData = s.children[0].textContent.split(" ")
        shedule["dia"] = sheduleData[0]
        shedule["desde"] = sheduleData[2]
        shedule["hasta"] = sheduleData[4].replace(".", "")
        if (s.children[1]) {
          shedule["salon"] = s.children[1].textContent
        } else {
          shedule["salon"] = ""
        }
        shedules.push(shedule)
        shedule = {}
      }
    }
    groupObj["horarios"] = shedules
    groupObj["duracion"] = groupData[3].textContent.split(": ")[1]
    groupObj["jornada"] = groupData[4].textContent.split(": ")[1]

    groupObj["isFavourite"] = false
    if (groupData[5] == undefined) {
      groupObj["cupos"] = "NaN"
    } else {
      groupObj["cupos"] = parseInt(groupData[5].textContent.split(": ")[1])
      courseObj["cuposDisponibles"] += parseInt(
        groupData[5].textContent.split(": ")[1]
      )
    }
    //add group to course
    courseObj["grupos"].push(groupObj)
    groupObj = {}
  }
  return courseObj
}

// check if the user is on course page (this is a bad way to do this, but is fine for now)
function isCoursePage() {
  var url = document.URL
  if (url.startsWith("https://sia.unal.edu.co/")) {
    //&& url.endsWith("AC_CatalogoAsignaturas")
    try {
      if (
        document.getElementsByClassName("ocu-titulo")[0].textContent ==
        "Información de la asignatura"
      ) {
        return true
      }
    } catch (e) {
      return false
    }
  }
  return false
}

// add the listeners that receive events from popup
chrome.runtime.onMessage.addListener(function (request) {
  //console.log(request)
  switch (request.operation) {
    case "LOAD": {
      //console.log("LOAD PRESSED")
      document.dispatchEvent(
        new CustomEvent("coursesEvent", { detail: request.data })
      )
      break
    }
    case "SAVE": {
      if (isCoursePage()) {
        var data = getCourseData()
        //send data back to popup.js
        chrome.runtime.sendMessage(data)
      } else {
        console.log("No se encuentra en la pagina de una asignatura")
      }
      break
    }
  }
})
