const fs = require('fs');

try {
    let content = fs.readFileSync('src/components/GrowDetail.tsx', 'utf8');

    // Remove unused vars
    content = content.replace(/const { id } = useParams<{ id: string }>\(\);/g, '// Unused id removed');
    content = content.replace('const { grows, profiles, setups, seeds = [], updateGrow, deleteGrow } = useStore();', 'const { profiles, setups, seeds = [], updateGrow, deleteGrow } = useStore();');

    // Fix unused setDli
    content = content.replace(/const \[([^,]+), setDli\] =/g, 'const [$1] =');

    // Fix implicit any for single arguments without parentheses
    content = content.replace(/\b(l) =>/g, '(l: any) =>');
    content = content.replace(/\b(log) =>/g, '(log: any) =>');
    content = content.replace(/\b(n) =>/g, '(n: any) =>');
    content = content.replace(/\b(s) =>/g, '(s: any) =>');
    content = content.replace(/\b(name) =>/g, '(name: any) =>');
    content = content.replace(/\b(task) =>/g, '(task: any) =>');
    content = content.replace(/\b(nut) =>/g, '(nut: any) =>');

    // Fix implicit any for multiple arguments
    content = content.replace(/\(a, b\) =>/g, '(a: any, b: any) =>');
    content = content.replace(/\(task, idx\) =>/g, '(task: any, idx: any) =>');
    content = content.replace(/\(n, i\) =>/g, '(n: any, i: any) =>');
    content = content.replace(/\(img, idx\) =>/g, '(img: any, idx: any) =>');
    
    // Fix index errors on t.profiles.stages
    content = content.replace(/t\.profiles\.stages\[/g, '(t.profiles.stages as any)[');
    content = content.replace(/t\.profiles\?\.stages\[/g, '(t.profiles?.stages as any)[');

    fs.writeFileSync('src/components/GrowDetail.tsx', content);
    console.log('GrowDetail.tsx modified successfully.');
} catch (e) {
    console.error('Error modifying GrowDetail.tsx:', e);
}
