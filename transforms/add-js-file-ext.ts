// Issues
// - Strips comments
// - removes type specifiers

// Need to use
// npx @hypermod/cli --parser tsx ==extensions ts --transform transforms/add-js-file-ext.ts src

function transform(file, { j }) {
    const root = j(file.source);

    root
        .find(j.ImportDeclaration, {
            source: { value: v => v.startsWith('.') && !v.endsWith('.js') && !v.endsWith('.ts') && !v.endsWith('.cjs') && !v.endsWith('.mjs') && !v.endsWith('.mts') && !v.endsWith('.cts') },
        })
        .replaceWith((path) => {
            const { node } = path;
            const newSourceValue = node.source.value.concat('.js');
            return j.importDeclaration(node.specifiers, j.literal(newSourceValue));
        });

    return root.toSource();
}

export default transform;
