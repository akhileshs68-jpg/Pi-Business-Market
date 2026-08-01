import re

with open('src/pages/StoreDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { useNavigate } from 'react-router-dom';", "import { useNavigate, useParams } from 'react-router-dom';")

content = content.replace("export const StoreDashboard: React.FC = () => {", "export const StoreDashboard: React.FC = () => {\n  const { businessId } = useParams<{ businessId?: string }>();")

content = content.replace("const [filterBusiness, setFilterBusiness] = useState<string>('all');", "const [filterBusiness, setFilterBusiness] = useState<string>(businessId || 'all');")

with open('src/pages/StoreDashboard.tsx', 'w') as f:
    f.write(content)
