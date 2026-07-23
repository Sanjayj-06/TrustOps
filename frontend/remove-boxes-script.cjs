const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

function processFile(filePath) {
    if (!filePath.endsWith('.tsx')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Pattern for generic box wrapping an icon:
    // <div className="... flex items-center justify-center ...">
    //   <IconName ... />
    // </div>
    // We use a regex that matches a div with 'flex items-center justify-center', containing exactly one self-closing JSX tag.
    let boxRegex = /<div\s+className="[^"]*?\bw-[0-9]+\s+h-[0-9]+\b[^"]*?flex\s+items-center\s+justify-center[^"]*">\s*<([A-Z][a-zA-Z0-9]*)\b[^>]*\/>\s*<\/div>/gs;
    
    content = content.replace(boxRegex, (match, iconName) => {
        if (iconName === 'CheckCircle' || iconName === 'CheckCircle2') {
            // retain only the tick icon, destroy the box
            let innerMatch = match.match(/<CheckCircle[2]?\b[^>]*\/>/);
            return innerMatch ? innerMatch[0] : '';
        }
        // destroy box and icon
        return ''; 
    });

    // Also handle cases where the icon is conditional: { condition ? <Icon/> : <Icon/> } inside the box
    let boxConditionalRegex = /<div\s+className="[^"]*?\bw-[0-9]+\s+h-[0-9]+\b[^"]*?flex\s+items-center\s+justify-center[^"]*">\s*{[^}]*}\s*<\/div>/gs;
    content = content.replace(boxConditionalRegex, (match) => {
        if (match.includes('CheckCircle') || match.includes('CheckCircle2')) {
            let innerMatch = match.match(/{[^}]*}/);
            return innerMatch ? innerMatch[0] : '';
        }
        return '';
    });

    // Handle SectionHeader in App.tsx:
    if (filePath.includes('App.tsx')) {
        let sectionHeaderBox = /<div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">\s*{icon}\s*<\/div>/g;
        content = content.replace(sectionHeaderBox, '');
        // We also want to remove the `<SectionHeader icon={...} title="..." />` `icon` prop completely because we want the icon gone?
        // Wait, if we remove {icon} box in SectionHeader, we don't even need the icon prop. 
        // We can leave the icon prop in the calls but it won't be rendered. Perfect!
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Processed:', filePath);
    }
}

walkDir(path.join(__dirname, 'src', 'components'), processFile);
processFile(path.join(__dirname, 'src', 'App.tsx'));
