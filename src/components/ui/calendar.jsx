import * as React from "react"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  selected,
  onSelect,
  showTimeSelect = false,
  ...props
}) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected ? new Date(selected) : new Date()
  )
  const [selectedHour, setSelectedHour] = React.useState(
    selected ? selected.getHours() : 0
  )
  const [selectedMinute, setSelectedMinute] = React.useState(
    selected ? selected.getMinutes() : 0
  )
  const [tempSelectedDay, setTempSelectedDay] = React.useState(
    selected ? selected.getDate() : null
  )

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    )
  }

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    )
  }

  const handleDayClick = (day) => {
    if (day) {
      const newDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day,
        selectedHour,
        selectedMinute
      )
      if (!showTimeSelect) {
        onSelect?.(newDate)
      } else {
        // When time select is shown, update temp selection for visual feedback
        setTempSelectedDay(day)
        setCurrentMonth(newDate)
      }
    }
  }

  const handleTimeChange = (newHour = selectedHour, newMinute = selectedMinute) => {
    // Get the currently selected day (use temp selection if available)
    const day = tempSelectedDay || selected?.getDate() || currentMonth.getDate() || new Date().getDate()
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
      newHour,
      newMinute
    )
    onSelect?.(newDate)
  }

  const isSelected = (day) => {
    if (!day) return false
    
    // If time select is shown and we have a temp selection, use that
    if (showTimeSelect && tempSelectedDay !== null) {
      return day === tempSelectedDay
    }
    
    // Otherwise check against the selected prop
    if (!selected) return false
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    )
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    )
  }

  const isToday = (day) => {
    if (!day) return false
    const today = new Date()
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    )
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Generate hour options (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i)
  // Generate minute options (0, 15, 30, 45)
  const minutes = [0, 15, 30, 45]

  return (
    <div className={cn("p-4", className)} {...props}>
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePreviousMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-base font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div
            key={day}
            className="text-sm text-center font-semibold text-gray-600 pb-2"
          >
            {day}
          </div>
        ))}
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => handleDayClick(day)}
            disabled={!day}
            className={cn(
              "h-11 w-11 text-sm font-medium rounded-lg hover:bg-gray-100 disabled:opacity-0 transition-colors",
              isSelected(day) && "bg-[#111d29] text-white hover:bg-[#1a2936]",
              isToday(day) && !isSelected(day) && "border-2 border-[#111d29] text-[#111d29]",
              day && "cursor-pointer"
            )}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Time Selection */}
      {showTimeSelect && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Select Time</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-600 mb-1 block">Hour</label>
              <select
                value={selectedHour}
                onChange={(e) => {
                  setSelectedHour(parseInt(e.target.value))
                  handleTimeChange()
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#111d29] focus:border-transparent"
              >
                {hours.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-600 mb-1 block">Minute</label>
              <select
                value={selectedMinute}
                onChange={(e) => {
                  setSelectedMinute(parseInt(e.target.value))
                  handleTimeChange()
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#111d29] focus:border-transparent"
              >
                {minutes.map((minute) => (
                  <option key={minute} value={minute}>
                    {minute.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button
            onClick={() => handleTimeChange(selectedHour, selectedMinute)}
            className="w-full mt-3 bg-[#111d29] hover:bg-[#1a2936] text-white"
            size="sm"
          >
            Apply Time
          </Button>
        </div>
      )}
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }

