
import re

s = "gpcr AND 'rhodopsin 2' AND 'bar 2' AND foo OR tm7+bAR"
s = "gpcr+rho"

s = re.sub( "(\s+OR\s+)", " ", s )
s = re.sub( "(\s+AND\s+|\s?\+\s?)", "+", s )
print s

x = re.findall( 
    r"[^\s,\"']+|\"[^\"]*\"|'[^']*'", s
)
print x

x2 = []
ix = iter(x)
for xx in ix:
    if xx=="+":
        x2[-1] += xx + next( ix )
    elif xx[-1]=="+":
        x2.append( xx + next( ix ) )
        print xx
    elif xx[0]=="+":
        x2[-1] += xx
    else:
        x2.append( xx )


print x2

q_or = []
for _or in x2:
    q_and = []
    for _and in _or.split("+"):
        q_and.append( _and.strip("'\"") )
    q_or.append( "('" + "' AND '".join( q_and ) + "')" )
q_or = "('" + "' OR '".join( q_or ) + "')"

print q_or

#x = [ k.strip("'\"") for k in x ]




# x = re.split(
#     r"[[^(\bAND\b)]|\s]",
#     s
# )
# x = filter( None, x )
# print x


# for xx in x
# x2 = re.split(
#     "(\bAND\b)",
#     s
# )

# print x

# for xx2 in x2:
#     print re.findall( 
#         r"[^\s,\"']+|\"[^\"]*\"|'[^']*'", s
#     )



