// Debug script to check date handling issues
import { format, startOfWeek, endOfWeek } from 'date-fns'

console.log('=== Date Debugging ===')

// Today's date
const today = new Date()
console.log('Today (local):', today.toString())
console.log('Today (ISO):', today.toISOString())
console.log('Today string:', today.toISOString().split('T')[0])

// Week calculation
const weekStart = startOfWeek(today, { weekStartsOn: 1 })
const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
console.log('\nWeek start (local):', weekStart.toString())
console.log('Week start (ISO):', weekStart.toISOString())
console.log('Week end (local):', weekEnd.toString())
console.log('Week end (ISO):', weekEnd.toISOString())

// Simulate commitment date from DB (2025-01-18)
const commitmentDateFromDB = '2025-01-18'
console.log('\n=== Commitment Date Processing ===')
console.log('From DB:', commitmentDateFromDB)

// Method 1: Adding T00:00:00 (current approach)
const date1 = new Date(commitmentDateFromDB + 'T00:00:00')
console.log('Method 1 (T00:00:00):', date1.toString())
console.log('Method 1 ISO:', date1.toISOString())

// Method 2: Direct parse (better approach)
const date2 = new Date(commitmentDateFromDB)
console.log('Method 2 (direct):', date2.toString())
console.log('Method 2 ISO:', date2.toISOString())

// Method 3: Using local date parts
const [year, month, day] = commitmentDateFromDB.split('-').map(Number)
const date3 = new Date(year, month - 1, day)
console.log('Method 3 (local parts):', date3.toString())
console.log('Method 3 ISO:', date3.toISOString())

// Generate week dates for comparison
console.log('\n=== Week Days Generation ===')
for (let i = 0; i < 5; i++) {
  const date = new Date(weekStart)
  date.setDate(weekStart.getDate() + i)
  const dateString = date.toISOString().split('T')[0]
  console.log(`Day ${i} (${['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i]}):`, dateString)
  console.log(`  Matches ${commitmentDateFromDB}?`, dateString === commitmentDateFromDB)
}

// Better approach for consistent date strings
console.log('\n=== Better Approach ===')
function getLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

for (let i = 0; i < 5; i++) {
  const date = new Date(weekStart)
  date.setDate(weekStart.getDate() + i)
  const dateString = getLocalDateString(date)
  console.log(`Day ${i} (${['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i]}):`, dateString)
  console.log(`  Matches ${commitmentDateFromDB}?`, dateString === commitmentDateFromDB)
}