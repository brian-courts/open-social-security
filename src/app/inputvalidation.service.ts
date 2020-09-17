import {Injectable} from '@angular/core'
import {Person} from './data model classes/person'
import {CalculationScenario} from './data model classes/calculationscenario'
import {ErrorCollection} from './data model classes/errorcollection'
import {MonthYearDate} from "./data model classes/monthyearDate"

@Injectable({
  providedIn: 'root'
})
export class InputValidationService {

  deemedFilingCutoff: Date = new Date(1954, 0, 1)
  today: MonthYearDate = new MonthYearDate()
  sixMonthsAgo:MonthYearDate
  twelveMonthsAgo:MonthYearDate

  constructor() {
    this.setToday(new MonthYearDate())
  }

  setToday(today:MonthYearDate){
    this.today = new MonthYearDate(today)
    this.sixMonthsAgo = new MonthYearDate(today)
    this.sixMonthsAgo.setMonth(this.sixMonthsAgo.getMonth()-6)
    this.twelveMonthsAgo = new MonthYearDate(today)
    this.twelveMonthsAgo.setFullYear(this.twelveMonthsAgo.getFullYear()-1)
  }

  checkErrorCollectionForErrors(errorCollection:ErrorCollection):boolean{
    if (
      errorCollection.personAfixedRetirementDateError ||
      errorCollection.personBfixedRetirementDateError ||
      errorCollection.personAfixedMotherFatherDateError ||
      errorCollection.personAfixedSurvivorDateError ||
      errorCollection.customPersonAretirementDateError ||
      errorCollection.customPersonBretirementDateError ||
      errorCollection.customPersonAspousalDateError ||
      errorCollection.customPersonBspousalDateError ||
      errorCollection.customPersonAbeginSuspensionDateError ||
      errorCollection.customPersonBbeginSuspensionDateError ||
      errorCollection.customPersonAendSuspensionDateError ||
      errorCollection.customPersonBendSuspensionDateError ||
      errorCollection.customPersonASurvivorDateError
      ){
        console.log(errorCollection)
        return true
      }
    else {
      return false
    }
  }

  checkPrimaryFormInputsForErrors(errorCollection:ErrorCollection, scenario:CalculationScenario, personA:Person, personB:Person):ErrorCollection{
    errorCollection = this.checkForFixedRetirementDateErrors(errorCollection, scenario, personA, personB)
    errorCollection = this.checkForFixedSurvivorDateErrors(errorCollection, scenario, personA, personB)
    // this.checkForFixedMotherFatherDateErrors()

    //Set hasErrors boolean
    errorCollection.hasErrors = this.checkErrorCollectionForErrors(errorCollection)

    return errorCollection
  }

  checkForFixedRetirementDateErrors(errorCollection:ErrorCollection, scenario:CalculationScenario, personA:Person, personB:Person):ErrorCollection{
    //reset errors
    errorCollection.personAfixedRetirementDateError = undefined
    errorCollection.personBfixedRetirementDateError = undefined
    //check for errors
    if (personA.hasFiled === true || personA.isOnDisability === true) {
      errorCollection.personAfixedRetirementDateError = this.checkValidRetirementInput(scenario, personA, personA.fixedRetirementBenefitDate)
    }
    if ( ((scenario.maritalStatus == "married" || scenario.maritalStatus == "survivor") && personB.hasFiled === true) || //If married or survivor and personB has filed
        (scenario.maritalStatus == 'married' && personB.isOnDisability === true) || //or married and personB on disability
        (scenario.maritalStatus == "divorced" && personB.isOnDisability === false) )  {//or if divorced and personB is not disabled. (If divorced and personB *is* disabled, personB just automatically gets a date of today)
      errorCollection.personBfixedRetirementDateError = this.checkValidRetirementInput(scenario, personB, personB.fixedRetirementBenefitDate)
    }
    return errorCollection
  }

  checkForFixedSurvivorDateErrors(errorCollection:ErrorCollection, scenario:CalculationScenario, personA:Person, personB:Person):ErrorCollection{
    //reset error
    errorCollection.personAfixedSurvivorDateError = undefined
    //Check for errors
    if (scenario.maritalStatus == "survivor" || personA.hasFiledAsSurvivor === true){
      errorCollection.personAfixedSurvivorDateError = this.checkValidSurvivorInput(personA, personB, personA.fixedSurvivorBenefitDate)
    }
    return errorCollection
  }

  checkForCustomDateErrors(errorCollection:ErrorCollection, scenario:CalculationScenario, personA:Person, personB:Person):ErrorCollection{
    //reset errors
    errorCollection.customPersonAretirementDateError = undefined
    errorCollection.customPersonBretirementDateError = undefined
    errorCollection.customPersonAspousalDateError = undefined
    errorCollection.customPersonBspousalDateError = undefined
    errorCollection.customPersonAbeginSuspensionDateError = undefined
    errorCollection.customPersonBbeginSuspensionDateError = undefined
    errorCollection.customPersonAendSuspensionDateError = undefined
    errorCollection.customPersonBendSuspensionDateError = undefined
    errorCollection.customPersonASurvivorDateError = undefined
    //Check for errors
    errorCollection.customPersonAretirementDateError = this.checkValidRetirementInput(scenario, personA, personA.retirementBenefitDate)
    if (scenario.maritalStatus == "married" || scenario.maritalStatus == "divorced"){
      errorCollection.customPersonAspousalDateError = this.checkValidSpousalInput(scenario, personA, personB, personA.retirementBenefitDate, personA.spousalBenefitDate, personB.retirementBenefitDate)
    }
    if (scenario.maritalStatus == "married") {
      errorCollection.customPersonBretirementDateError = this.checkValidRetirementInput(scenario, personB, personB.retirementBenefitDate)
      errorCollection.customPersonBspousalDateError = this.checkValidSpousalInput(scenario, personB, personA, personB.retirementBenefitDate, personB.spousalBenefitDate, personA.retirementBenefitDate)
    }
    if (personA.initialAge < 70 && personA.declineSuspension === false && (personA.isOnDisability === true || personA.hasFiled === true)){
      errorCollection.customPersonAbeginSuspensionDateError = this.checkValidBeginSuspensionInput(personA)
      errorCollection.customPersonAendSuspensionDateError = this.checkValidEndSuspensionInput(personA)
    }
    if (scenario.maritalStatus == "married" && personB.initialAge < 70 && personB.declineSuspension === false && (personB.isOnDisability === true || personB.hasFiled === true)){
      errorCollection.customPersonBbeginSuspensionDateError = this.checkValidBeginSuspensionInput(personB)
      errorCollection.customPersonBendSuspensionDateError = this.checkValidEndSuspensionInput(personB)
    }
    if (scenario.maritalStatus == "survivor"){
      errorCollection.customPersonASurvivorDateError = this.checkValidSurvivorInput(personA, personB, personA.survivorBenefitDate)
    }
    //Set hasErrors boolean
    errorCollection.hasErrors = this.checkErrorCollectionForErrors(errorCollection)

    return errorCollection
  }

  checkValidRetirementInput(scenario:CalculationScenario, person:Person, retirementBenefitDate:MonthYearDate):string {
    let error:string = undefined

    //Make sure there is an input
    if (!retirementBenefitDate || isNaN(retirementBenefitDate.getFullYear()) ){
      if (scenario.maritalStatus == "divorced" && person.id == "B"){
        error = "Your ex-spouse's filing date is necessary in order to run the calculation. If you do not know the answer, you can call the SSA to see if your ex-spouse has filed for his/her retirement benefit. Or you can guess as to your ex-spouse's plans (e.g., assume they file at age 66)."
      }
      else {//otherwise just give generic "please enter date" message
        error = "Please enter a date."
      }
      return error
    }

    //Validation in case they try to start retirement benefit earlier first 62-all-month month or after 70
    let earliestDate: MonthYearDate = new MonthYearDate(person.actualBirthDate.getFullYear()+62, person.actualBirthDate.getMonth())
    if (person.actualBirthDate.getDate() > 1) {//i.e., if they are born after 2nd of month ("1" is second of month)
      earliestDate.setMonth(earliestDate.getMonth()+1)
    }
    if (person.isOnDisability === false && retirementBenefitDate < earliestDate) {error = "Please enter a later date. A person cannot file for retirement benefits before the first month in which they are 62 for the entire month."}
    let latestDate: MonthYearDate = new MonthYearDate (person.SSbirthDate.getFullYear()+70, person.SSbirthDate.getMonth(), 1)
    if (retirementBenefitDate > latestDate && person.PIA > 0) {error = "Please enter an earlier date. You do not want to wait beyond age 70."}

    //If retirement benefit input date is in the past, make sure it's for a legitimate reason
    if (retirementBenefitDate < this.today){
      if (person.fixedRetirementBenefitDate) {//i.e., because they already filed, are disabled, or they are personB in a divorce scenario)
        //no error
      }
      else if (retirementBenefitDate >= person.FRA && retirementBenefitDate >= this.sixMonthsAgo){
        //no error
      }
      else {
        error = "The effective date for a retroactive application for retirement benefits must be no earlier than your full retirement age and no more than 6 months before today."
      }
    }

    return error
  }

  checkValidSpousalInput(scenario:CalculationScenario, person:Person, otherPerson:Person, ownRetirementBenefitDate:MonthYearDate, spousalBenefitDate:MonthYearDate, otherPersonRetirementBenefitDate:MonthYearDate):string {
    let error:string = undefined
    let secondStartDate:MonthYearDate = new MonthYearDate(1,1,1)
    //Make sure there is an input (Note that this will get overridden in the customDates function after the error check, in cases where there isn't supposed to be a user input)
    if ( isNaN(spousalBenefitDate.getFullYear()) || isNaN(spousalBenefitDate.getMonth()) ) {
      error = "Please enter a date."
    }

    //If spousal input date is in the past, make sure it's for a legitimate reason
    if (spousalBenefitDate < this.today){
      if (person.fixedRetirementBenefitDate) {//i.e., person is disabled, has filed, or is personB in a divorce scenario
        //no error, because retirement date is in the past, and validation function already checks to make sure spousal input date is valid with respect to both people's retirement dates)
      }
      else if (spousalBenefitDate >= person.FRA && spousalBenefitDate >= this.sixMonthsAgo && otherPerson.isOnDisability === false){
        //no error
      }
      else if (spousalBenefitDate >= person.FRA && spousalBenefitDate >= this.twelveMonthsAgo && otherPerson.isOnDisability === true){
        //no error
      }
      else {
        error = "The effective date for a retroactive application for spousal benefits must be no earlier than your full retirement age and no more than 6 months before today (12 months if your spouse/ex-spouse is disabled)."
      }
    }

    //Deemed filing validation
    if (person.actualBirthDate < this.deemedFilingCutoff) {//old deemed filing rules apply: If spousalBenefitDate < FRA, it must not be before own retirementBenefitDate
        if (spousalBenefitDate < person.FRA && spousalBenefitDate < ownRetirementBenefitDate)
        {
        error = "A person cannot file a restricted application (i.e., application for spousal-only) prior to their FRA."
        }
    }
    else {//new deemed filing rules apply
      //Married version: own spousalBenefitDate must equal later of own retirementBenefitDate or other spouse's retirementBenefitDate
      //Of note: entitlement to disability benefits + eligibility for spousal benefit does NOT cause deemed filing
        if(scenario.maritalStatus == "married") {
          if (ownRetirementBenefitDate < otherPersonRetirementBenefitDate) {
            secondStartDate = new MonthYearDate(otherPersonRetirementBenefitDate)
          }
          else {
            secondStartDate = new MonthYearDate(ownRetirementBenefitDate)
          }
          if (person.PIA > 0 && otherPerson.PIA > 0 ){//if they have a zero PIA, there's no deemed filing to worry about. Similarly, if the other person has a zero PIA, we don't really care what this person has for a spousalBenefitDate.
            if (spousalBenefitDate.valueOf() !== secondStartDate.valueOf() && person.isOnDisability === false && person.childInCareSpousal === false) {
              error = "Per new deemed filing rules, a person's spousal benefit date must be the later of their own retirement benefit date, or their spouse's retirement benefit date."
            }
          }
        }
      //Divorced version: own spousalBenefitDate must equal later of own retirementBenefitDate or other spouse's age62 date
        //If otherPerson is already on disability benefits, "second start date" is just own retirement benefit date
        //Of note: entitlement to own disability benefit + eligibility for spousal benefit does NOT cause deemed filing
        if(scenario.maritalStatus == "divorced") {
          let exSpouse62Date = new MonthYearDate(otherPerson.actualBirthDate.getFullYear()+62, otherPerson.actualBirthDate.getMonth())
          if (otherPerson.actualBirthDate.getDate() > 1){//i.e., if they are born after 2nd of month ("1" is second of month)
            exSpouse62Date.setMonth(exSpouse62Date.getMonth()+1)
          }
          if (ownRetirementBenefitDate < exSpouse62Date && otherPerson.isOnDisability === false) {//ie, if own retirement benefit date comes before otherPerson is 62, and otherPerson is not disabled
            secondStartDate = new MonthYearDate(exSpouse62Date)
          }
          else {//ie., if own retirementBenefitDate comes after other person is 62, or if otherPerson is disabled
            secondStartDate = new MonthYearDate(ownRetirementBenefitDate)
          }
          if (person.PIA > 0 && otherPerson.PIA > 0){//if they have a zero PIA, there's no deemed filing to worry about. Similarly, if the other person has a zero PIA, we don't really care what this person has for a spousalBenefitDate.
            if (spousalBenefitDate.valueOf() !== secondStartDate.valueOf() && person.isOnDisability === false && person.childInCareSpousal === false) {
              error = "Per new deemed filing rules, your spousal benefit date must be the later of your retirement benefit date, or the first month in which your ex-spouse is 62 for the entire month."
            }
          }
        }
    }

    //Validation in case they try to start benefit earlier than own "62 all month" month.
    let earliestDate: MonthYearDate = new MonthYearDate(person.actualBirthDate.getFullYear()+62, person.actualBirthDate.getMonth())
    if (person.actualBirthDate.getDate() > 1) {//i.e., if they are born after 2nd of month ("1" is second of month)
      earliestDate.setMonth(earliestDate.getMonth()+1)
    }
    if (spousalBenefitDate < earliestDate) {error = "Please enter a later date. A person cannot file for spousal benefits before the first month in which they are 62 for the entire month."}

    //Validation in case they try to start spousal benefit before other spouse's retirement benefit.
    if (spousalBenefitDate < otherPersonRetirementBenefitDate && scenario.maritalStatus == "married") {error = "A person cannot start spousal benefits before the other spouse has filed for his/her own retirement benefit."}
   
    return error
  }

  checkValidBeginSuspensionInput(person:Person):string{
    let error: string = undefined
    //Must be a valid date (ie, includes both month and year inputs)
    if (isNaN(person.beginSuspensionDate.getFullYear()) || isNaN(person.beginSuspensionDate.getMonth())) {
      error = "Please enter a date."
    }
    //can't be before today
    if (person.beginSuspensionDate < this.today){
      error = "Please enter a date no earlier than today."
    }
    //can't be before fixedRetirementBenefitDate
    if (person.beginSuspensionDate < person.fixedRetirementBenefitDate){
      error = "It is not possible to suspend a retirement benefit prior to having filed for that retirement benefit."
    }
    //can't be before FRA
    if (person.beginSuspensionDate < person.FRA){
      error = "It is not possible to suspend benefits prior to full retirement age."
    }
    return error
  }

  checkValidEndSuspensionInput(person:Person):string{
    let error: string = undefined
    //Must be a valid date (ie, includes both month and year inputs)
    if (isNaN(person.endSuspensionDate.getFullYear()) || isNaN(person.endSuspensionDate.getMonth())){
      error = "Please enter a date."
    }
    //Can't be before begin suspension date
    if (person.endSuspensionDate < person.beginSuspensionDate){
      error = "Please enter an end-suspension date that is no earlier than the begin-suspension date."
    }
    //Can't be after 70
    if (person.endSuspensionDate > new MonthYearDate(person.SSbirthDate.getFullYear()+70, person.SSbirthDate.getMonth(), 1)){
      error = "Please enter a date no later than the month in which this person attains age 70."
    }
    return error
  }

  checkValidSurvivorInput(livingPerson:Person, deceasedPerson:Person, survivorBenefitDate:MonthYearDate):string{
    let error:string = undefined
    //Make sure there is an input
    if (!survivorBenefitDate || isNaN(survivorBenefitDate.getFullYear()) || isNaN(survivorBenefitDate.getMonth()) ){
        error = "Please enter a date." 
    }
    //Can't be before age 60 (50 if disabled)
    let age50date:MonthYearDate = new MonthYearDate(livingPerson.SSbirthDate.getFullYear()+50, livingPerson.SSbirthDate.getMonth())
    let age60date:MonthYearDate = new MonthYearDate(livingPerson.SSbirthDate.getFullYear()+60, livingPerson.SSbirthDate.getMonth())
    if (survivorBenefitDate < age50date || (survivorBenefitDate < age60date && livingPerson.isOnDisability === false) ) {
      error = "A survivor benefit cannot be claimed before age 60 (50 if disabled)."
    }
    //Can't be before deceasedPerson.dateOfDeath
    if (survivorBenefitDate < deceasedPerson.dateOfDeath){
      error = "A survivor benefit cannot be claimed prior to the deceased spouse's date of death."
    }
    //If input date is in the past, make sure it's for a legitimate reason
    if (survivorBenefitDate < this.today){
      if (livingPerson.fixedSurvivorBenefitDate) {//i.e., because they already filed for survivor benefits
        //no error
      }
      else if (survivorBenefitDate >= livingPerson.survivorFRA && survivorBenefitDate >= this.sixMonthsAgo){//survivorBenefitdate is after survivor FRA and no more than 6 months ago
        //no error
      }
      else if (livingPerson.isOnDisability === true && survivorBenefitDate >= this.twelveMonthsAgo){//survivor is disabled and survivorBenefitDate is no more than 12 months ago
        //no error
      }
      else {
        error = "The effective date for a retroactive application for survivor benefits must be no earlier than 6 months before today (12 if disabled). If you are not disabled, the effective date must also be no earlier than your survivor FRA."
      }
    }

    return error
  }

}
