with open('frontend/js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Check JSX and brackets balance
stack = []
pairs = {')': '(', ']': '[', '}': '{'}
in_string = False
str_char = ''
in_line_comment = False
in_block_comment = False
escape = False

errors = []
i = 0
n = len(code)
while i < n:
    ch = code[i]
    if in_line_comment:
        if ch == '\n':
            in_line_comment = False
        i += 1
        continue
    if in_block_comment:
        if i + 1 < n and code[i:i+2] == '*/':
            in_block_comment = False
            i += 2
            continue
        i += 1
        continue
    if in_string:
        if escape:
            escape = False
        elif ch == '\\':
            escape = True
        elif ch == str_char:
            in_string = False
        i += 1
        continue
    if i + 1 < n and code[i:i+2] == '//':
        in_line_comment = True
        i += 2
        continue
    if i + 1 < n and code[i:i+2] == '/*':
        in_block_comment = True
        i += 2
        continue
    if ch in ('"', "'", '`'):
        in_string = True
        str_char = ch
        i += 1
        continue
    if ch in ('(', '[', '{'):
        stack.append((ch, i))
    elif ch in (')', ']', '}'):
        if not stack:
            line_no = code[:i].count('\n') + 1
            errors.append(f'Unmatched closing {ch} at line {line_no}')
        else:
            top, pos = stack.pop()
            if top != pairs[ch]:
                line_no = code[:i].count('\n') + 1
                top_line = code[:pos].count('\n') + 1
                errors.append(f'Mismatched {top} (line {top_line}) and {ch} (line {line_no})')
    i += 1

if stack:
    print('Unclosed brackets remaining:', len(stack))
    for item in stack[:5]:
        line_no = code[:item[1]].count('\n') + 1
        print(f'Unclosed {item[0]} from line {line_no}')
elif errors:
    print('Errors found:', errors)
else:
    print('SUCCESS: All brackets, parens, and braces are perfectly balanced! (0 errors)')
