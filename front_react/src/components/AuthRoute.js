const { getToken } = require("@/utils");
const { Navigate } = require("react-router-dom");

function AuthRoute({ children }) {
    const token = getToken()
    if (token) {
        return <>{children}</>
    } else {
        return <Navigate to={'/login'} replace />
    }
}

export { AuthRoute }