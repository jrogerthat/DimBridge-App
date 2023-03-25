import uuid

from os import environ
from pathlib import Path
import json
import time

from flask import Flask, request
import pandas as pd
from sklearn.manifold import TSNE

from predicates import infer_dtypes, encode, data_to_predicates, unique, bin_numeric, F1, PredicateInduction, parse_value_string, Predicate

DATA_FOLDER: Path = Path(Path(__file__).parent, 'data')

api = Flask(__name__)
api.config['SECRET_KEY'] = environ.get('SECRET_KEY')
projection_algorithms = {'tsne': TSNE(n_components=2).fit_transform}
datasets = {'redwine': 'winequality-red-w-tsne.csv', 'countries': 'countries.csv', 'property': 'melbourne_property_w_umap.csv', 'genes': 'gene_data.csv'}


@api.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', '*')

    return response


@api.route('/api/data')
def data(dataset=None, projection_algorithm=None):
    """
    Load data given a path to a csv, infer dtypes, and transform the data given a projection algorithm. Returns projection data.
    :param dataset: The name of the dataset.
    :type dataset: str
    :param projection_algorithm: Name of the projection algorithm to be used as it appears in projection_algorithms.
    :type projection_algorithm: str
    :return: Projection data.
    :rtype: dict
    """

    dataset = request.args.get('dataset')
    features = pd.read_csv(str(Path(DATA_FOLDER, datasets[dataset]))) #dataframe containing original data

    # features = features.sample(1000, random_state=5345435)
    features = features.to_dict(orient='records')

    for i in range(len(features)):
        f = features[i]
        f['id'] = i
    return features


@api.route('/api/predicates')
def predicate(dataset=None, projection_algorithm=None, selected_ids=None, comparison_ids=None):
    dataset = request.args.get('dataset')
    projection_algorithm = request.args.get('projection_algorithm')
    selected_ids = [int(x) for x in request.args.get('selected_ids').split(',')]
    comparison_ids = [int(x) for x in request.args.get('comparison_ids').split(',')] if request.args.get('comparison_ids') is not None else None

    c1_idx = [3, 9, 13, 16, 22, 26, 29, 32, 34, 36, 37, 47, 49, 50, 51, 52, 56, 58, 59, 63, 65, 79, 80, 82, 84, 91, 94, 95, 97, 98, 99, 101, 109, 110, 114, 115, 118, 121, 126, 135, 148, 154, 159, 161, 163, 173, 175, 180, 183, 184, 188, 200, 205, 206, 215, 216, 221, 232, 234, 239, 242, 244, 245, 247, 251, 254, 255, 259, 264, 266, 267, 268, 270, 273, 277, 283, 289, 290, 293, 301, 302, 311, 319, 321, 322, 324, 326, 328, 335, 338, 341, 352, 354, 355, 360, 367, 370, 371, 378, 380, 381, 384, 387, 397, 398, 403, 404, 410, 413, 414, 424, 425, 428, 430, 431, 437, 441, 443, 445, 453, 467, 470, 472, 480, 502, 505, 507, 510, 514, 515, 528, 529, 540, 541, 544, 545, 548, 550, 553, 563, 570, 575, 577, 578, 580, 581, 583, 587, 588, 591, 592, 593, 600, 601, 605, 607, 611, 616, 617, 621, 622, 629, 632, 634, 635, 642, 645, 650, 656, 657, 658, 659, 663, 664, 665, 669, 672, 684, 696, 701, 705, 706, 707, 722, 724, 727, 729, 732, 738, 739, 744, 745, 748, 749, 750, 759, 760, 762, 766, 769, 774, 776, 778, 783, 786, 789, 790, 793, 794, 796, 798, 802, 810, 811, 812, 822, 823, 832, 834, 836, 871, 873, 882, 893, 895, 898, 899, 902, 908, 911, 914, 918, 923, 935, 939, 944, 948, 954, 955, 956, 957, 965, 971, 972, 973, 974, 979, 984, 985, 990, 1000, 1001, 1003, 1004, 1014, 1017, 1020, 1021, 1023, 1027, 1029, 1030, 1031, 1036, 1038, 1046, 1048, 1051, 1052, 1053, 1055, 1056, 1060, 1061, 1069, 1071, 1073, 1077, 1078, 1081, 1082, 1087, 1091, 1099, 1101, 1103, 1106, 1111, 1114, 1117, 1118, 1119, 1126, 1141, 1144, 1151, 1155, 1158, 1161, 1162, 1165, 1167, 1172, 1185, 1188, 1190, 1192, 1200, 1205, 1206, 1212, 1216, 1226, 1228, 1231, 1233, 1236, 1242, 1254, 1256, 1257, 1265, 1269, 1272, 1278, 1284, 1289, 1292, 1295, 1296, 1297, 1301, 1304, 1310, 1315, 1317, 1322, 1323, 1327, 1334, 1335, 1336, 1339, 1342, 1344, 1346, 1349, 1350, 1353, 1354, 1356, 1365, 1370, 1380, 1383, 1387, 1397, 1401, 1403, 1405, 1406, 1415, 1421, 1427, 1451, 1454, 1455, 1458, 1459, 1461, 1464, 1466, 1467, 1474, 1475, 1477, 1478, 1481, 1484, 1486, 1487, 1492, 1507, 1508, 1510, 1511, 1512, 1517, 1522, 1524, 1531, 1537, 1538, 1543, 1544, 1549, 1552, 1563, 1566, 1569, 1570, 1585, 1587, 1588, 1589, 1590, 1591, 1594, 1597, 1599, 1607, 1609, 1613, 1617, 1622, 1624, 1625, 1629, 1633, 1634, 1635, 1642, 1644, 1646, 1647, 1653, 1654, 1659, 1661, 1662, 1664, 1667, 1670, 1673, 1698, 1704, 1711, 1713, 1718, 1722, 1728, 1732, 1734, 1744, 1745, 1746, 1748, 1751, 1759, 1766, 1770, 1771, 1772, 1775, 1777, 1778, 1780, 1782, 1784, 1792, 1798, 1799, 1800, 1802, 1804, 1811, 1814, 1815, 1826, 1829, 1832, 1837, 1840, 1844, 1854, 1867, 1868, 1870, 1871, 1879, 1884, 1886, 1891, 1893, 1908, 1910, 1912, 1914, 1917, 1918, 1920, 1926, 1929, 1935, 1936, 1938, 1944, 1946, 1948, 1950, 1952, 1954, 1957, 1959, 1968, 1976, 1981, 1983, 1984, 1988, 1989, 1997, 2002, 2015, 2017, 2018, 2027, 2031, 2032, 2034, 2041, 2042, 2043, 2046, 2051, 2053, 2055, 2058, 2061, 2062, 2064, 2067, 2078, 2081, 2088, 2090, 2092, 2093, 2094, 2097, 2101, 2105, 2113, 2116, 2120, 2124, 2138, 2149, 2159, 2168, 2170, 2178, 2179, 2183, 2193, 2194, 2195, 2196, 2203, 2204, 2207, 2209, 2215, 2221, 2223, 2225, 2229, 2235, 2237, 2239, 2242, 2243, 2245, 2257, 2259, 2262, 2265, 2268, 2276, 2278, 2280, 2282, 2293, 2294, 2303, 2306, 2319, 2323, 2324, 2326, 2327, 2328, 2329, 2335, 2336, 2338, 2340, 2341, 2353, 2356, 2362, 2367, 2368, 2369, 2370, 2372, 2378, 2386, 2388, 2397, 2398, 2400, 2406, 2415, 2416, 2417, 2419, 2422, 2428, 2433, 2435, 2437, 2440, 2448, 2452, 2456, 2460, 2463, 2466, 2469, 2478, 2481, 2484, 2489, 2490, 2491, 2492, 2500, 2505, 2506, 2507, 2508, 2514, 2516, 2520, 2521, 2527, 2530, 2531, 2537, 2538, 2539, 2544, 2545, 2550, 2552, 2555, 2557, 2559, 2563, 2566, 2568, 2571, 2573, 2578, 2582, 2584, 2589, 2591, 2596, 2597, 2600, 2603, 2605, 2606, 2608, 2611, 2622, 2623, 2624, 2625, 2629, 2632, 2633]
    c1_overlap = len(set(selected_ids).intersection(c1_idx))/len(c1_idx)
    c2_idx = [1,10,18,19,20,23,31,55,75,85,88,89,92,93,105,107,117,122,127,134,139,143,146,160,162,165,178,179,181,190,192,218,231,241,249,253,257,258,272,275,280,281,288,295,303,312,313,317,325,337,351,361,366,376,377,385,389,402,407,408,411,419,422,426,427,440,454,478,488,504,508,513,520,525,561,569,572,589,590,597,628,631,637,638,639,640,646,649,652,661,679,680,681,683,687,697,699,702,709,713,716,763,764,765,780,800,801,807,809,849,854,856,857,859,866,868,869,876,886,919,920,926,927,930,933,949,958,961,964,966,980,988,996,999,1009,1024,1034,1035,1039,1045,1049,1054,1058,1063,1066,1068,1080,1085,1096,1097,1110,1113,1116,1124,1125,1129,1152,1159,1164,1174,1178,1183,1197,1198,1203,1207,1221,1276,1285,1299,1307,1308,1314,1330,1369,1371,1396,1409,1413,1422,1430,1431,1457,1462,1488,1489,1500,1505,1509,1513,1520,1532,1533,1541,1542,1553,1555,1574,1577,1578,1580,1582,1615,1616,1621,1637,1638,1639,1640,1643,1672,1674,1715,1726,1738,1743,1750,1756,1765,1783,1791,1796,1808,1809,1810,1824,1834,1836,1869,1881,1882,1892,1894,1898,1903,1915,1919,1930,1931,1932,1934,1947,1949,1974,1987,1994,2000,2007,2009,2013,2019,2037,2040,2044,2052,2056,2070,2071,2089,2106,2107,2111,2114,2125,2129,2133,2135,2144,2145,2160,2164,2166,2167,2173,2175,2184,2200,2218,2220,2222,2246,2248,2254,2269,2271,2281,2298,2307,2310,2312,2315,2325,2331,2344,2348,2359,2373,2385,2387,2390,2393,2407,2408,2409,2412,2413,2414,2418,2426,2443,2444,2446,2451,2467,2474,2486,2488,2503,2519,2523,2526,2529,2532,2533,2554,2560,2586,2590,2593,2595,2609,2613,2614,2615,2618,2620,2628,2630,2634,2635,2636]
    c2_overlap = len(set(selected_ids).intersection(c2_idx))/len(c2_idx)

    c3_idx = [0,2,4,5,6,7,8,11,12,14,15,17,21,24,25,27,28,30,33,35,38,39,40,41,42,43,44,45,46,48,53,54,57,60,61,62,64,66,67,68,69,70,71,72,73,74,76,77,78,81,83,86,87,90,96,100,102,103,104,106,108,111,112,113,116,119,120,123,124,125,128,129,130,131,132,133,136,137,138,140,141,142,144,145,147,149,150,151,152,153,155,156,157,158,164,166,167,168,169,170,171,172,174,176,177,182,185,186,187,189,191,193,194,195,196,197,198,199,201,202,203,204,207,208,209,210,211,212,213,214,217,219,220,222,223,224,225,226,227,228,229,230,233,235,236,237,238,240,243,246,248,250,252,256,260,261,262,263,265,269,271,274,276,278,279,282,284,285,286,287,291,292,294,296,297,298,299,300,304,305,306,307,308,309,310,314,315,316,318,320,323,327,329,330,331,332,333,334,336,339,340,342,343,344,345,346,347,348,349,350,353,356,357,358,359,362,363,364,365,368,369,372,373,374,375,379,382,383,386,388,390,391,392,393,394,395,396,399,400,401,405,406,409,412,415,416,417,418,420,421,423,429,432,433,434,435,436,438,439,442,444,446,447,448,449,450,451,452,455,456,457,458,459,460,461,462,463,464,465,466,468,469,471,473,474,475,476,477,479,481,482,483,484,485,486,487,489,490,491,492,493,494,495,496,497,498,499,500,501,503,506,509,511,512,516,517,518,519,521,522,523,524,526,527,530,531,532,533,534,535,536,537,538,539,542,543,546,547,549,551,552,554,555,556,557,558,559,560,562,564,565,566,567,568,571,573,574,576,579,582,584,585,586,594,595,596,598,599,602,603,604,606,608,609,610,612,613,614,615,618,619,620,623,624,625,626,627,630,633,636,641,643,644,647,648,651,653,654,655,660,662,666,667,668,670,671,673,674,675,676,677,678,682,685,686,688,689,690,691,692,693,694,695,698,700,703,704,708,710,711,712,714,715,717,718,719,720,721,723,725,726,728,730,731,733,734,735,736,737,740,741,742,743,746,747,751,752,753,754,755,756,757,758,761,767,768,770,771,772,773,775,777,779,781,782,784,785,787,788,791,792,795,797,799,803,804,805,806,808,813,814,815,816,817,818,819,820,821,824,825,826,827,828,829,830,831,833,835,837,838,839,840,841,842,843,844,845,846,847,848,850,851,852,853,855,858,860,861,862,863,864,865,867,870,872,874,875,877,878,879,880,881,883,884,885,887,888,889,890,891,892,894,896,897,900,901,903,904,905,906,907,909,910,912,913,915,916,917,921,922,924,925,928,929,931,932,934,936,937,938,940,941,942,943,945,946,947,950,951,952,953,959,960,962,963,967,968,969,970,975,976,977,978,981,982,983,986,987,989,991,992,993,994,995,997,998,1002,1005,1006,1007,1008,1010,1011,1012,1013,1015,1016,1018,1019,1022,1025,1026,1028,1032,1033,1037,1040,1041,1042,1043,1044,1047,1050,1057,1059,1062,1064,1065,1067,1070,1072,1074,1075,1076,1079,1083,1084,1086,1088,1089,1090,1092,1093,1094,1095,1098,1100,1102,1104,1105,1107,1108,1109,1112,1115,1120,1121,1122,1123,1127,1128,1130,1131,1132,1133,1134,1135,1136,1137,1138,1139,1140,1142,1143,1145,1146,1147,1148,1149,1150,1153,1154,1156,1157,1160,1163,1166,1168,1169,1170,1171,1173,1175,1176,1177,1179,1180,1181,1182,1184,1186,1187,1189,1191,1193,1194,1195,1196,1199,1201,1202,1204,1208,1209,1210,1211,1213,1214,1215,1217,1218,1219,1220,1222,1223,1224,1225,1227,1229,1230,1232,1234,1235,1237,1238,1239,1240,1241,1243,1244,1245,1246,1247,1248,1249,1250,1251,1252,1253,1255,1258,1259,1260,1261,1262,1263,1264,1266,1267,1268,1270,1271,1273,1274,1275,1277,1279,1280,1281,1282,1283,1286,1287,1288,1290,1291,1293,1294,1298,1300,1302,1303,1305,1306,1309,1311,1312,1313,1316,1318,1319,1320,1321,1324,1325,1326,1328,1329,1331,1332,1333,1337,1338,1340,1341,1343,1345,1347,1348,1351,1352,1355,1357,1358,1359,1360,1361,1362,1363,1364,1366,1367,1368,1372,1373,1374,1375,1376,1377,1378,1379,1381,1382,1384,1385,1386,1388,1389,1390,1391,1392,1393,1394,1395,1398,1399,1400,1402,1404,1407,1408,1410,1411,1412,1414,1416,1417,1418,1419,1420,1423,1424,1425,1426,1428,1429,1432,1433,1434,1435,1436,1437,1438,1439,1440,1441,1442,1443,1444,1445,1446,1447,1448,1449,1450,1452,1453,1456,1460,1463,1465,1468,1469,1470,1471,1472,1473,1476,1479,1480,1482,1483,1485,1490,1491,1493,1494,1495,1496,1497,1498,1499,1501,1502,1503,1504,1506,1514,1515,1516,1518,1519,1521,1523,1525,1526,1527,1528,1529,1530,1534,1535,1536,1539,1540,1545,1546,1547,1548,1550,1551,1554,1556,1557,1558,1559,1560,1561,1562,1564,1565,1567,1568,1571,1572,1573,1575,1576,1579,1581,1583,1584,1586,1592,1593,1595,1596,1598,1600,1601,1602,1603,1604,1605,1606,1608,1610,1611,1612,1614,1618,1619,1620,1623,1626,1627,1628,1630,1631,1632,1636,1641,1645,1648,1649,1650,1651,1652,1655,1656,1657,1658,1660,1663,1665,1666,1668,1669,1671,1675,1676,1677,1678,1679,1680,1681,1682,1683,1684,1685,1686,1687,1688,1689,1690,1691,1692,1693,1694,1695,1696,1697,1699,1700,1701,1702,1703,1705,1706,1707,1708,1709,1710,1712,1714,1716,1717,1719,1720,1721,1723,1724,1725,1727,1729,1730,1731,1733,1735,1736,1737,1739,1740,1741,1742,1747,1749,1752,1753,1754,1755,1757,1758,1760,1761,1762,1763,1764,1767,1768,1769,1773,1774,1776,1779,1781,1785,1786,1787,1788,1789,1790,1793,1794,1795,1797,1801,1803,1805,1806,1807,1812,1813,1816,1817,1818,1819,1820,1821,1822,1823,1825,1827,1828,1830,1831,1833,1835,1838,1839,1841,1842,1843,1845,1846,1847,1848,1849,1850,1851,1852,1853,1855,1856,1857,1858,1859,1860,1861,1862,1863,1864,1865,1866,1872,1873,1874,1875,1876,1877,1878,1880,1883,1885,1887,1888,1889,1890,1895,1896,1897,1899,1900,1901,1902,1904,1905,1906,1907,1909,1911,1913,1916,1921,1922,1923,1924,1925,1927,1928,1933,1937,1939,1940,1941,1942,1943,1945,1951,1953,1955,1956,1958,1960,1961,1962,1963,1964,1965,1966,1967,1969,1970,1971,1972,1973,1975,1977,1978,1979,1980,1982,1985,1986,1990,1991,1992,1993,1995,1996,1998,1999,2001,2003,2004,2005,2006,2008,2010,2011,2012,2014,2016,2020,2021,2022,2023,2024,2025,2026,2028,2029,2030,2033,2035,2036,2038,2039,2045,2047,2048,2049,2050,2054,2057,2059,2060,2063,2065,2066,2068,2069,2072,2073,2074,2075,2076,2077,2079,2080,2082,2083,2084,2085,2086,2087,2091,2095,2096,2098,2099,2100,2102,2103,2104,2108,2109,2110,2112,2115,2117,2118,2119,2121,2122,2123,2126,2127,2128,2130,2131,2132,2134,2136,2137,2139,2140,2141,2142,2143,2146,2147,2148,2150,2151,2152,2153,2154,2155,2156,2157,2158,2161,2162,2163,2165,2169,2171,2172,2174,2176,2177,2180,2181,2182,2185,2186,2187,2188,2189,2190,2191,2192,2197,2198,2199,2201,2202,2205,2206,2208,2210,2211,2212,2213,2214,2216,2217,2219,2224,2226,2227,2228,2230,2231,2232,2233,2234,2236,2238,2240,2241,2244,2247,2249,2250,2251,2252,2253,2255,2256,2258,2260,2261,2263,2264,2266,2267,2270,2272,2273,2274,2275,2277,2279,2283,2284,2285,2286,2287,2288,2289,2290,2291,2292,2295,2296,2297,2299,2300,2301,2302,2304,2305,2308,2309,2311,2313,2314,2316,2317,2318,2320,2321,2322,2330,2332,2333,2334,2337,2339,2342,2343,2345,2346,2347,2349,2350,2351,2352,2354,2355,2357,2358,2360,2361,2363,2364,2365,2366,2371,2374,2375,2376,2377,2379,2380,2381,2382,2383,2384,2389,2391,2392,2394,2395,2396,2399,2401,2402,2403,2404,2405,2410,2411,2420,2421,2423,2424,2425,2427,2429,2430,2431,2432,2434,2436,2438,2439,2441,2442,2445,2447,2449,2450,2453,2454,2455,2457,2458,2459,2461,2462,2464,2465,2468,2470,2471,2472,2473,2475,2476,2477,2479,2480,2482,2483,2485,2487,2493,2494,2495,2496,2497,2498,2499,2501,2502,2504,2509,2510,2511,2512,2513,2515,2517,2518,2522,2524,2525,2528,2534,2535,2536,2540,2541,2542,2543,2546,2547,2548,2549,2551,2553,2556,2558,2561,2562,2564,2565,2567,2569,2570,2572,2574,2575,2576,2577,2579,2580,2581,2583,2585,2587,2588,2592,2594,2598,2599,2601,2602,2604,2607,2610,2612,2616,2617,2619,2621,2626,2627,2631,2637]
    c3_overlap = len(set(selected_ids).intersection(c3_idx))/len(c3_idx)

    df = pd.read_csv(str(Path(DATA_FOLDER, datasets[dataset]))).drop(columns=['x', 'y']) #dataframe containing original data
    dtypes = infer_dtypes(df)

    # binned_df = bin_numeric(df, dtypes)
    target = df.index.isin(selected_ids).astype(int)
    # attribute_predicates, indices = data_to_predicates(binned_df, df, dtypes)
    with open(Path(DATA_FOLDER, 'genes_attribute_predicates.json'), 'r') as f:
        attribute_predicates = json.load(f)
    for k,v in attribute_predicates.items():
        attribute_predicates[k] = [Predicate(df, dtypes, attribute_values=predicate_dict) for predicate_dict in v]

    f1 = F1()
    p = PredicateInduction(
        df, dtypes,
        target=target,
        score_func=f1,
        attribute_predicates=attribute_predicates,
    )

    print(c1_overlap, c2_overlap, c3_overlap)
    if c1_overlap > .8 and comparison_ids is None:
        with open(Path(DATA_FOLDER, 'genes_c1_predicates.json'), 'r') as f:
            predicate_dicts = list(json.load(f).values())
        predicates = [Predicate(df, dtypes, attribute_values=predicate_dict) for predicate_dict in predicate_dicts]
    elif c2_overlap > .8 and comparison_ids is None:
        with open(Path(DATA_FOLDER, 'genes_c2_predicates.json'), 'r') as f:
            predicate_dicts = list(json.load(f).values())
        predicates = [Predicate(df, dtypes, attribute_values=predicate_dict) for predicate_dict in predicate_dicts]
    elif c3_overlap > .8 and comparison_ids is None:
        with open(Path(DATA_FOLDER, 'genes_c3_predicates.json'), 'r') as f:
            predicate_dicts = list(json.load(f).values())
        predicates = [Predicate(df, dtypes, attribute_values=predicate_dict) for predicate_dict in predicate_dicts]
    else:
        start_time = time.time()
        p.search(None, max_accepted=1, max_steps=None, max_clauses=3, breadth_first=False)
        predicates = [p.last_accepted]
        end_time = time.time()
        print(predicate)
        print(end_time-start_time)

    
    # a = {k: list(v.unique()) for k,v in indices[target==1].to_dict('series').items()}
    # predicates = [x for y in [unique([attribute_predicates[k][i] for i in indices[k]]) for k,v in a.items()] for x in y]
    # p.search(predicates if not p.started_search else None, max_accepted=1, max_steps=None, max_clauses=3, breadth_first=False)
    # predicate = p.last_accepted

    # clauses = {k: {'min': v[0], 'max': v[1]} for k,v in predicate.attribute_values.items()}
    # return [{'id': uuid.uuid4(), 'type': 'pixal', 'clauses': clauses, 'score': p.score(predicate)}]

    # with open(Path(DATA_FOLDER, 'genes_c1_predicates.json'), 'r') as f:
    #     predicate_dicts = list(json.load(f).values())
    predicates = sorted(predicates, key=lambda x: len(x.predicate_attributes))

    print(predicates)
    return [{'id': uuid.uuid4(), 'type': 'pixal', 'clauses': {k: {'min': v[0], 'max': v[1]} for k,v in predicates[i].attribute_values.items()}, 'score': p.score(predicates[i])} for i in range(len(predicates))]
    # return [{'id': uuid.uuid4(), 'clauses': [{'column': 'pH', 'min': 3.37, 'max': 3.38}]}]

@api.route('/api/score_predicate')
def score_predicate():
    dataset = request.args.get('dataset')
    selected_ids = [int(x) for x in request.args.get('selected_ids').split(',')]

    data = pd.read_csv(str(Path(DATA_FOLDER, datasets[dataset])))
    dtypes = infer_dtypes(data)
    attribute_values = {k:v for k,v in request.args.to_dict().items() if k in dtypes}
    predicate = Predicate(data, dtypes, **{k: parse_value_string(v, dtypes[k]) for k,v in attribute_values.items()})
    target = pd.Series(data.index.isin(selected_ids))

    f1 = F1()
    p = PredicateInduction(
        data, dtypes,
        target=target,
        score_func=f1,
    )
    score = p.score(predicate)
    return {'score': score}

@api.route('/api/score_predicates', methods=['POST'])
def score_predicates():
    dataset = request.args.get('dataset')
    selected_ids = [int(x) for x in request.args.get('selected_ids').split(',')]
    comparison_ids = [int(x) for x in request.args.get('comparison_ids').split(',')] if request.args.get('comparison_ids') is not None else None
    predicate_dicts = request.get_json()

    data = pd.read_csv(str(Path(DATA_FOLDER, datasets[dataset])))
    dtypes = infer_dtypes(data)

    for i, pred in enumerate(predicate_dicts):
        transformed_clauses = {}
        for c, r in pred['clauses'].items():
            if c in dtypes:
                transformed_clauses[c] = [r['min'], r['max']]
        pred['clauses'] = transformed_clauses

    predicates = [Predicate(data, dtypes, **predicate_dict['clauses']) for predicate_dict in predicate_dicts]
    target = pd.Series(data.index.isin(selected_ids))

    print(predicates)
    
    mask = pd.Series(data.index**0).astype(bool) if comparison_ids is None else target | data.index.isin(comparison_ids)
    f1 = F1()
    p = PredicateInduction(
        data.loc[mask.values].reset_index(drop=True), dtypes,
        target=target.loc[mask.values].reset_index(drop=True),
        score_func=f1,
    )

    scores = [p.score(pred) for pred in predicates]
    clauses = [pred['id'] for pred in predicate_dicts]
    res = [{'id': clauses[i], 'score': scores[i]} for i in range(len(predicates))]
    return res

if __name__ == "__main__":
    api.run(host='localhost',port=5000)


# @api.route('/api/predicate')
# def predicate(selected_ids=None, reference_ids=None):
#     """
#     Find the next best predicate given a set of selected ids and reference ids. The state of the predicate induction algorithm is stored as session data and will
#     resume the next time predicate is called.
#
#     :param selected_ids: List of ids for selected data points.
#     :type selected_ids: list
#     :param reference_ids: List of ids for reference data points.
#     :type reference_ids: list
#     :return: The id, name, and bayes factor for the next best predicate. Projection data with the selection and predicate as additional binary columns.
#              Data for the predicate error heatmap.
#     :rtype: dict
#     """
#
#     kwargs = request.get_json(force=True)
#     selected_ids = kwargs.get('selected_ids', [] if selected_ids is None else selected_ids)
#     reference_ids = kwargs.get('reference_ids', [i for i in range(session['data']['data'].shape[0]) if i not in selected_ids] if reference_ids is None else reference_ids)
#     ids = list(set(selected_ids + reference_ids))
#     df = session['data']['data'][session['data']['data'].index.isin(ids)] # only use only selected and reference data
#
#     # setup predicate induction algorithm
#     attribute_predicates=session['predicates'].get('attribute_predicates', data_to_predicates(df.loc[reference_ids], session['data']['dtypes'], df))
#     pi = PredicateInduction(
#         target=pd.Series(selected_ids),
#         score_func=Anomaly(dtype='binary'),
#         attribute_predicates=attribute_predicates,
#         frontier=session['predicates'].get('frontier'),
#         accepted=session['predicates'].get('accepted'),
#         rejected=session['predicates'].get('rejected')
#     )
#     predicate = pi.search(n=1) # run predicate induction algorithm until one new predicate is accepted
#
#     # save state of predicate induction algorithm as session data
#     session['predicates']['attribute_predicates'] = pi.attribute_predicates
#     session['predicates']['frontier'] = pi.frontier
#     session['predicates']['accepted'] = pi.accepted
#     session['predicates']['rejected'] = pi.rejected
#
#     projection = session['data']['projection'].assign(
#         selected=session['data']['projection'].index.isin(selected_ids),
#         predicate=predicate.mask.astype(int)
#     ) # add selected and predicate binary columns to projection data
#
#     # build false positive/negative rate heatmap
#     num_heatmap_bins = kwargs.get('num_heatmap_bins', 10)
#     heatmap_counts = projection.groupby(
#         [pd.cut(projection.x, bins=num_heatmap_bins), pd.cut(projection.y, bins=num_heatmap_bins)]
#     )[['tp', 'tn', 'fp', 'fn']].sum()
#     heatmap = pd.concat(
#         [heatmap_counts['fp']/(heatmap_counts['fp']+heatmap_counts['tn']), heatmap_counts['fn']/(heatmap_counts['fn']+heatmap_counts['tp'])],
#     axis=1).reset_index()
#
#     response_body = {
#         "id": predicate.id,
#         "name": predicate.name,
#         "bayes_factor" : pi.score(predicate),
#         'data': projection.to_dict('records'),
#         'heatmap': heatmap.to_dict('records'),
#     }
#     return response_body
#
# @api.route('/api/explanations')
# def explanations(predicate_id=None, num_bins=10):
#     """
#     Returns data needed to plot all explanations for a given predicate.
#
#     :param predicate_id: ID of the predicate want explanations for.
#     :type selected_ids: int
#     :param num_bins: Number of bins to use for histogram explanations.
#     :type reference_ids: int
#     :return: A list of explanations. Each explanation is a dictionary containing the local neighborhood data and which attributes to use for x/y-axes.
#     :rtype: dict
#     """
#
#     kwargs = request.get_json(force=True)
#     predicate = session['predicates']['accepted'][kwargs.get('predicate_id', predicate_id)]
#     attributes_1d = predicate.predicate_attributes
#     attributed_2d = combinations(attributes_1d, 2)
#
#     data = session['data']['data']
#     num_bins = kwargs.get('num_bins', num_bins)
#     explanations = []
#
#     # get 1D explanations
#     for attribute in attributes_1d:
#         dtype = session['data']['dtypes'][attribute]
#         grouper = [pd.cut(data[attribute], bins=num_bins), predicate.mask.astype(int)] if dtype == 'numeric' else [data[attribute], predicate.mask.astype(int)]
#         other_attributes = [attr for attr in predicate.attributes if attr != attribute]
#         d = data.loc[predicate.attribute_mask[other_attributes].all(axis=1)].groupby(grouper).count().reset_index()
#         d.columns = [attribute, 'predicate', 'count']
#         d['group_count'] = d.predicate.map(d.groupby('predicate')['count'].sum())
#
#         explanation = {'data': d.to_dict('records')}
#         explanation['x'] = attribute
#         explanation['y'] = 'count'
#         explanations.append(explanation)
#
#     # get 2D explanations
#     for attribute_x, attribute_y in attributed_2d:
#         dtype = session['data']['dtypes'][attribute]
#         other_attributes = [attr for attr in predicate.attributes if attr not in (attribute_x, attribute_y)]
#         d = data.assign(predicate=predicate.mask.astype(int)).loc[predicate.attribute_mask[other_attributes].all(axis=1)][[attribute_x, attribute_y, 'predicate']]
#
#         explanation = {'data': d.to_dict('records')}
#         explanation['x'] = attribute_x
#         explanation['y'] = attribute_y
#         explanations.append(explanation)
#
#         response_body = {
#             "explanations": explanations
#         }
#         return response_body
