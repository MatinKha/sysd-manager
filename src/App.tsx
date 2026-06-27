import { ConfigProvider, Layout, Splitter, theme } from "antd";
import "./App.css";
import { Content } from "antd/es/layout/layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UnitSplit from "./components/UnitSplit";

function App() {
  const queryClient = new QueryClient();

  return (

    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <div style={{ height: "100vh" }}>
          <Layout style={{ height: "100%" }}>
            <Content>
              <UnitSplit />
            </Content>
          </Layout >
        </div>
      </ConfigProvider >
    </QueryClientProvider>
  );
}

export default App;
