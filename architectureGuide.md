# 🏗️ e-Rumah Project Architecture Standards

## **Project Structure**
```
src/
├── models/          # Data structures, validation, business logic
├── views/           # Page-level UI components (presentational only)
├── controllers/     # State management, event handlers, orchestration
├── components/      # Reusable UI elements (buttons, inputs, cards)
│   ├── common/      # Generic reusable components
│   ├── landing/     # Landing page specific components
│   └── application/ # Application feature components
├── layouts/         # Page layouts (headers, footers, wrappers)
├── utils/           # Helper functions, shared utilities
└── config/          # Configuration files
```

## **🚨 CRITICAL RULES - MUST FOLLOW**

### **Rule 1: Layer Isolation**
Files within the same layer **CANNOT** import each other:
- ❌ `View → View` imports are **FORBIDDEN**
- ❌ `Controller → Controller` imports are **FORBIDDEN**  
- ❌ `Model → Model` imports are **FORBIDDEN**

### **Rule 2: Allowed Communication**
```
Controller → Model (fetch/manipulate data)
Controller → View (pass data as props)
View → Components (use reusable UI elements)
Any layer → Utils (helper functions)
```

### **Rule 3: Data Flow**
```
Model ← Controller → View
        ↓
    Components
```
Controllers orchestrate everything. Views only render. Models only handle data.

## **📁 File Responsibilities**

### **Models (`models/`):**
- Data structures and schemas
- API calls and data fetching
- Business logic and validation
- **NO** UI rendering
- **Example:** `Application.js` - handles application data CRUD

### **Views (`views/`):**
- Page-level components
- Receives ALL data via props from controller
- **NO** business logic (calculation, validation, API calls)
- **NO** importing other views
- **NO** state management (except local UI state like form inputs)
- **Example:** `ApplicationFormView.jsx` - renders form, receives handlers as props

### **Controllers (`controllers/`):**
- Manages state (useState, useEffect)
- Handles events and user interactions
- Coordinates between Model and View
- Contains business logic flow
- **NO** importing other controllers
- **Example:** `ApplicationController.jsx` - manages form submission, validation

### **Components (`components/`):**
- Small, reusable UI pieces
- Can be used by Views
- Should be generic and reusable
- **Example:** `Button.jsx`, `Input.jsx`, `StatusBadge.jsx`

## **✅ Correct Pattern**
```jsx
// ✅ ApplicationController.jsx
import Application from '../models/Application'
import ApplicationFormView from '../views/ApplicationFormView'

function ApplicationController() {
  const [data, setData] = useState({})
  const model = new Application()
  
  const handleSubmit = async (formData) => {
    await model.save(formData)
  }
  
  return <ApplicationFormView data={data} onSubmit={handleSubmit} />
}
```

```jsx
// ✅ ApplicationFormView.jsx
import Button from '../components/common/Button'

function ApplicationFormView({ data, onSubmit }) {
  return (
    <form onSubmit={onSubmit}>
      <Button>Submit</Button>
    </form>
  )
}
```

## **❌ Wrong Patterns**
```jsx
// ❌ WRONG - View importing another View
import ManageApplicationView from './ManageApplicationView'

// ❌ WRONG - View doing API calls
const saveData = async () => {
  await fetch('/api/applications', {...})
}

// ❌ WRONG - Controller importing another Controller
import ApplicationController from './ApplicationController'

// ❌ WRONG - Model importing another Model
import User from './User'
```

## **🎨 Styling**
- Use **plain CSS files** (no Tailwind)
- Each component/view has its own `.css` file
- Keep classNames semantic: `className="hero"` not `className="flex p-4"`

## **🛠️ Tech Stack**
- React 19.2.0
- React Router 7.9.6
- Supabase for backend
- Vite for bundling
- Plain CSS (NO Tailwind)

## **📝 Naming Conventions**
- Controllers: `*Controller.jsx`
- Views: `*View.jsx`
- Models: `*.js`
- Components: PascalCase (`Button.jsx`)
- CSS: Same name as component (`Button.css`)

---

**When in doubt:** Ask "Does this follow strict MVC layer separation?" If a file needs to talk to another file in the same layer, you're doing it wrong. Use controllers to orchestrate, components for reusability, and utils for shared logic.
