import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "./pages/auth/PrivateRoute";
import Profile from "./pages/Profile";
import Layout from "./layout/Layout";
import Feed from "./pages/Feed";
import Notification from "./pages/Notification";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ModalProvider from "./context/ModalContext";
import AuthProvider from "./pages/auth/AuthProvider";
import SinglePostPage from "./pages/SinglePostPage";
import { ThemeProvider } from "./context/ThemeContext";
import About from "./pages/About";
import { Navigate } from "react-router-dom";
import MyStories from "./pages/MyStories";
import SavedStories from "./pages/SavedStories";
import Settings from "./pages/Setting";

const queryClient = new QueryClient();

export default function App() {

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider >
          <ModalProvider>
            <AuthProvider>
              <BrowserRouter>
                <Routes>
                  <Route element={<Layout />}>
   
                    {/* Public */}
                    <Route path="/" element={<Feed />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/story/:post_id" element={<SinglePostPage />} />

                    {/* Private */}
                    <Route element={<PrivateRoute />}>
                      <Route path="/notification" element={<Notification />} />

                      <Route path="/profile" element={<Profile />}>
                        <Route index element={<Navigate to="my-stories" replace />} />
                        <Route path="my-stories" element={<MyStories />} />
                        <Route path="saved-stories" element={<SavedStories />} />
                        <Route path="settings" element={<Settings />} />
                      </Route>
                    </Route>

                  </Route>
                </Routes>
              </BrowserRouter>
            </AuthProvider>
          </ModalProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </>
  )
}

