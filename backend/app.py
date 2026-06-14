from operator import contains
from socket import gethostbyname, gaierror
from sys import exception
from pygnmi.client import gNMIclient
import json, os
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from secrets import token_hex

# TODO: Create a mock mode to test frontend
# TODO: sanitize values and escape values
# TODO: write assertions/assumptions
# MOCK_MODE=False
# Path where we expect the topology file to be mounted
# CLAB_TOPO_PATH = os.environ.get('CLAB_TOPO_FILE', '/app/topology.yml')
path_root=os.environ.get('ROOT_PATH', 'certs/ca.pem')

def get_sni(input_string: str):
    """
    Splits a string by hyphens ('-') and returns the last resulting segment.
    """
    return input_string.split("-")[-1]

def findANYsecEncServices(host, port , username, password):
# Helper function to find the services running ANYsec service encryption
# Returns a list with service names, bgp-instances and anysec groups pairings

    # servicesIterator = filter(lambda v: v is not None, values)
    encInstances = []
    possibleServices = ["sdp", "ies", "epipe", "cpipe", "vpls", "vprn"]
    possibleCPlanes = ["bgp-evpn", "bgp-ipvpn"]
    # TODO: SDP, bgp-evpn, bgp-ipvpn, 
    result = get_gnmi_req(["/configure/service"], host, get_sni(host), port, username, password)["data"][0][1]
    for service in possibleServices:
      serviceConfig = result.get(service)
      if serviceConfig == None:
        continue
      for s in serviceConfig:
        for bgp in possibleCPlanes:
          bgpInstances = s.get(bgp)
          if bgpInstances == None:
            continue
          bgpInstances = bgpInstances.get("mpls")
          for instance in bgpInstances:
            encGroup = instance.get("anysec-encryption-group")
            if encGroup == None:
              continue
            encInstances.append({"service-name": s.get("service-name"),
                   "bgp-instance": instance.get("bgp-instance"),
                   "anysec-encryption-group": encGroup})
    return encInstances

def findServices(host, sni, port , username, password):
# Helper function to find the services running ANYsec service encryption
# Returns a list with service names, bgp-instances and anysec groups pairings

    # servicesIterator = filter(lambda v: v is not None, values)
    encInstances = []
    possibleServices = ["sdp", "ies", "epipe", "cpipe", "vpls", "vprn"]
    possibleCPlanes = ["bgp-evpn", "bgp-ipvpn"]
    # TODO: SDP, bgp-evpn, bgp-ipvpn, 
    result = get_gnmi_req(["/configure/service"], host, sni, port, username, password)["data"][0][1]
    for service in possibleServices:
      serviceConfig = result.get(service)
      if serviceConfig == None:
        continue
      for s in serviceConfig:
        for bgp in possibleCPlanes:
          bgpInstances = s.get(bgp)
          if bgpInstances == None:
            continue
          bgpInstances = bgpInstances.get("mpls")
          for instance in bgpInstances:
            encInstances.append({"serviceType": service, "service-name": s.get("service-name"),
                                 "bgp-instance": instance.get("bgp-instance"), "cPlane": bgp})
    return encInstances

def serviceEncPaths(host, port , username, password):
# Helper function to find the services running ANYsec service encryption
# Returns a list with path and anysec groups pairings

    # servicesIterator = filter(lambda v: v is not None, values)
    gnmiPath = "/configure/service"
    encInstances = []
    possibleServices = ["sdp", "ies", "epipe", "cpipe", "vpls", "vprn"]
    possibleCPlanes = ["bgp-evpn", "bgp-ipvpn"]
    # TODO: SDP, bgp-evpn, bgp-ipvpn, 
    result = get_gnmi_req([gnmiPath], host, port, username, password)["data"][0][1]
    for service in possibleServices:
      serviceConfig = result.get(service)
      if serviceConfig == None:
        continue
      servicePath = gnmiPath + "/" + service
      for s in serviceConfig:
        for bgp in possibleCPlanes:
          bgpInstances = s.get(bgp)
          if bgpInstances == None:
            continue
          bgpPath = servicePath + "[service-name=" + s.get("service-name") + "]/" + bgp
          bgpInstances = bgpInstances.get("mpls")
          for instance in bgpInstances:
            encGroup = instance.get("anysec-encryption-group")
            if encGroup == None:
              continue
            groupPath = bgpPath + "/mpls[bgp-instance=" + str(instance.get("bgp-instance")) + "]"
            encInstances.append({"path": groupPath,
                   "anysec-encryption-group": encGroup})
    return encInstances

class Host:
    def __init__(self, host, port, username, password):
      self.addr = gethostbyname(host)
      self.hostname = host
      self.port = port
      self.username = username
      self.password = password
      self.sni = get_sni(self.hostname)

    def importCAConfig(self, caName):
      gnmi_path = "/configure/macsec/connectivity-association[ca-name=" + caName + "]"
      # WARN: Should I not save all this info ?
      response, val = get_gnmi_req([gnmi_path], self.addr, self.sni, self.port, self.username, self.password)
      if val == 200:
        self.CAConfig = response[0][1]

    # WARN: does this break the pings?
    def enforce256CS(self, ca_name):
      # if xpn:
      #   cs = 'gcm-aes-xpn-256'
      # else:
      #   cs = 'gcm-aes-256'
      cs = 'gcm-aes-xpn-256'
      gnmi_path = "/configure/macsec/connectivity-association[ca-name=" + ca_name + "]"
      newConfig = {'cipher-suite': cs}
      jsonify(set_gnmi_req([(gnmi_path, newConfig)], self.addr, self.sni, self.port, self.username, self.password))


    # NOTE: Should I not give object attributes for stuff instead of doing it all like this?
    def importANYsecConfig(self, group):
      tunnel_path = "/configure/anysec/tunnel-encryption/encryption-group[group-name=" + group + "]"
      service_path = "/configure/anysec/service-encryption/encryption-group[group-name=" + group + "]"
      self.ANYsecConfig = get_gnmi_req([tunnel_path, service_path], self.addr, self.sni, self.port, self.username, self.password)[0][0]
      path, self.ANYsecConfig = self.ANYsecConfig
      if path.__contains__("service-encryption"):
        self.anysecType = "s"
      elif path.__contains__("tunnel-encryption"):
        self.anysecTunnelPath = "/configure/anysec/tunnel-encryption/encryption-group[group-name=" + group + "]"
        self.anysecType = "t"
      else:
        self.anysecType = False

    def getEncServicesByGroup(self, group):
      # Gets all the services that use anysec service encryption in a SROS router
      # Then filters them by their anysec group

      # servicesIterator = filter(lambda v: v is not None, values)
      gnmiPath = "/configure/service"
      encInstances = []
      possibleServices = ["sdp", "ies", "epipe", "cpipe", "vpls", "vprn"]
      possibleCPlanes = ["bgp-evpn", "bgp-ipvpn"]
      # TODO: SDP, bgp-evpn, bgp-ipvpn, 
      result = get_gnmi_req([gnmiPath], self.addr, self.sni, self.port, self.username, self.password)[0][0][1]

      for service in possibleServices:
        serviceConfig = result.get(service)
        if serviceConfig == None:
          continue
        servicePath = gnmiPath + "/" + service
        for s in serviceConfig:
          for bgp in possibleCPlanes:
            bgpInstances = s.get(bgp)
            if bgpInstances == None:
              continue
            bgpPath = servicePath + "[service-name=" + s.get("service-name") + "]/" + bgp
            bgpInstances = bgpInstances.get("mpls")
            for instance in bgpInstances:
              encGroup = instance.get("anysec-encryption-group")
              if encGroup != group:
                continue
              groupPath = bgpPath + "/mpls[bgp-instance=" + str(instance.get("bgp-instance")) + "]"
              encInstances.append({"path": groupPath,
                     "anysec-encryption-group": encGroup})
        try:
          if len(encInstances) == 0:
            self.encServicePath = None
          else:
            self.encServicePath = encInstances[0]["path"] + "/anysec-encryption-group"
        except Exception as e:
          # no enc services probable
          print(str(e), flush=True)
          self.encServicePath = None
    
    def leaveEncGroup(self): # TODO: change name to disable group
      if self.anysecType == "s" and self.encServicePath != None:
        try:
          with gNMIclient(target=(self.addr, self.port), username=self.username, password=self.password, insecure=True) as gc:
            result = gc.set(delete=[self.encServicePath])
            
            result = {
                    "status": "success",
                    "device": self.hostname,
                    "data": result
                    }

        except Exception as e:
          return {
              "status": "error",
              "message": str(e)
              }, 500

      elif self.anysecType == "t":
        newConf = {"admin-state": "disable"}
        result = set_gnmi_req([(self.anysecTunnelPath, newConf)], self.addr, self.sni, self.port, self.username, self.password)
        result = {
          "status": "success",
          "device": host,
          "data": result
          }
      else:
        result = {"status": "success",
                  "data": "Nothing Done"}
      return result, 200

    def getEncServPath(self):
      return self.encServicePath

    def createEncPath(self, group, service, cPlane, instance):
      if self.anysecType == "s":
        self.conf = {"anysec-encryption-group": group}

        # NOTE: I'm repeating myself on the services helper functions
        # I could just call the helper function and see if it matches
        services = findServices(self.addr, self.sni, self.port, self.username, self.password)
        for s in services:
          if s["service-name"] == service and s["cPlane"] == cPlane and s["bgp-instance"] == instance: # should I int() both bgp-instance and instance
            self.encPath = "/configure/service/" + s["serviceType"] + "[service-name=" + service + "]/" + cPlane + "/mpls[bgp-instance=" + str(instance) + "]"
      elif self.anysecType == "t":
        self.encPath  = "/configure/anysec/tunnel-encryption/encryption-group[group-name=" + group + "]"
        self.conf = {"admin-state": "enable"}
      else:
        # NOTE: What happens when no anysec group is configured
        return None
  
    def enableAnysecEnc(self):
      return set_gnmi_req([(self.encPath, self.conf)], self.addr, self.sni, self.port, self.username, self.password)

    def getInactivePSK(self):
      # Only Outputs the necessary data
      id = self.CAConfig['static-cak']['active-psk']
      for i in self.CAConfig['static-cak']['pre-shared-key']:
        if i['psk-id'] != id:
            return i
      else:
        return None

    # Assumes ANYsec exists, as it is time-sensitive
    # def disableANYsec(self, group):

    # def getState(self):

    # def getConfig(self):

# Use at the start of each endpoint function
# Gets the host data from the request and returns a list of hosts
# Assumes all hosts are configured with the same administrative user and password
def get_datafrom_req(request):
  port = request.args.get('port', "57400") 
  username = request.args.get('user', 'admin')
  password = request.args.get('pass', 'NokiaSros1!')
  try:
    hosts = json.loads(request.headers.get('X-Target-Hosts'))
  except json.JSONDecodeError:
    # Handle invalid JSON or empty hosts or single host
    hosts = [request.headers.get('X-Target-Hosts')]

  hostlist = []
  for host in hosts:
    hostlist.append(Host(host, port, username, password))
  
  return hostlist

def get_gnmi_req(gnmi_path, host, sni, port="57400", username="admin", password="NokiaSros1!", insecure=False):
  try:
    # WARNING: In production, use certificates.
    target = (host, port)
  
    with gNMIclient(target=target, username=username, password=password, insecure=insecure, path_root=path_root, skip_verify=insecure, override=sni) as gc:
      result = gc.get(path=gnmi_path, encoding='json')
      responses = []
      # WARN: if multiple values won't I get "update" and "values" instead of val?
      for i in result["notification"]:
        for j in i["update"]:
          if j.get("val") != None:
            responses.append((j.get("path"), j.get("val")))

  except Exception as e:
         return {
             "status": "error",
             "message": str(e)
             }, 500
  # WARN: Should I not return 404 if there are no valid responses
  # TODO: return only the values do the rest on the endpoint
  return responses, 200


def set_gnmi_req(value, host, sni, port="57400", username="admin", password="NokiaSros1!", insecure=False):
    try:
        # WARNING: In production, use certificates.
        target = (host, port)
    
        with gNMIclient(target=target, username=username, password=password, insecure=insecure, path_root=path_root, skip_verify=insecure, override=sni) as gc:
            result = gc.set(update=value)

        return result

    except Exception as e:
           return {
               "status": "error",
               "message": str(e)
               }, 500

app = Flask(__name__)
CORS(app)

# TODO: change host to hostlist logic
@app.route('/api/CA', methods=['GET'])
def host_CA_discovery():
  hostlist = get_datafrom_req(request)

  responses = {}
  # WARN: Only runs the first time
  gnmi_path = "/configure/macsec/connectivity-association[ca-name=*]"
  for host in hostlist:
    val, result = get_gnmi_req([gnmi_path], host.addr, host.sni, host.port, host.username, host.password)

    if result == 200:
      cas = []
      # WARN: Might need to recheck this with the final example
      for i in val:
        cas.append(i[1])
      responses[host.hostname] = cas
    else:
      return jsonify(val, result)
    
  # TODO: Error handling (no router for example)
  return responses


@app.route('/api/CA/<ca_name>', methods=['GET'])
def host_spec_ca_config(ca_name):
  hostlist = get_datafrom_req(request)

  gnmi_path = "/configure/macsec/connectivity-association[ca-name=" + ca_name + "]"

  responses = {}
  # WARN: Only runs the first time
  for host in hostlist:
    val, result = get_gnmi_req([gnmi_path], host.addr, host.sni, host.port, host.username, host.password)

    if result == 200:
      # WARN: Might need to recheck this with the final example
      if isinstance(val[0][1], list):
        val = val[0][1][0]
      else:
        val = val[0][1]
      responses[host.hostname] = val
    else:
      return jsonify(val, result)

  return responses

@app.route('/api/CA/<ca_name>/enable', methods=['POST'])
def enable_ca(ca_name):

    hostlist = get_datafrom_req(request)

    # WARNING: ca_name is not validated

    gnmi_path = "/configure/macsec/connectivity-association[ca-name=" + ca_name + "]"
    newConf = {"admin-state": "enable"}
    
    return jsonify(set_gnmi_req([(gnmi_path, newConf)], hostlist, hostlist.sni, port, username, password))

    # TODO: verifications after the request here

@app.route('/api/CA/<ca_name>/disable', methods=['POST'])
def disable_ca(ca_name):

    hostlist = get_datafrom_req(request)

    # WARNING: ca_name is not validated

    # Get data from payload
    gnmi_path = "/configure/macsec/connectivity-association[ca-name=" + ca_name + "]"
    newConf = {"admin-state": "disable"}

    return jsonify(set_gnmi_req([(gnmi_path, newConf)], hostlist, hostlist.sni, port, username, password))

    # TODO: verifications after the request here

@app.route('/api/CA/<ca_name>/rollover', methods=['POST'])
def rollover_cak(ca_name):

    # TODO: this should be a dict in the JSON
    hostlist = get_datafrom_req(request)

   #  print(request.is_json, flush=True)

   #  # TODO: Test to see if CAs really match. Are they really the same CA?
   #  xpn = request.json().get('XPN')
   #  print(xpn, type(xpn), flush=True)
    # TODO: XPN: True payload handling
    
    # WARNING: Assumes it is a list

    # WARNING: ca_name is not validated

    # Get CA state and config
    # It has to be enabled, operational
    # find active psk and encryption type
    # Check rest of configuration (including cipher suites)
    keyConfigs = []
    for host in hostlist:
        host.importCAConfig(ca_name)
        keyConfigs.append((host, host.getInactivePSK()))

    # NOTE : should I assume this or accept this as an argument for the endpoint
    # MKASuite = keyConfigs[0][1]['encryption-type']
    MKASuite = 'aes-256-cmac'
    # for i in keyConfigs:
    #   if i[1]['encryption-type'] != MKASuite:
    #     raise Exception("MKA Cipher Suites don't match")

    # WARN: CAs must be compared to see if they match

    # Generate CAK
    # if MKASuite.__contains__("256"):  # 256 bit cmac security
    #     # gen 256 bit or 64 hex char key
    #     secret = token_hex(32) # alternatively os.urandom
    # else:  # 128 bit cmac security
    #     secret = token_hex(16)


    # New CAK preparation
    secret = token_hex(32) # alternatively os.urandom
    cakName = token_hex(32)# even length hex string up to 64 char

    gnmi_path = "/configure/macsec/connectivity-association[ca-name=" + ca_name + "]/static-cak/pre-shared-key"

    for host, config in keyConfigs:
      newKey = {"cak": secret, "cak-name": cakName, "encryption-type": MKASuite, "psk-id": config['psk-id']}
      jsonify(set_gnmi_req([(gnmi_path, newKey)], host.addr, host.sni, host.port, host.username, host.password))

    # TODO: Check if key was rolled over correctly
    
    # TODO: Make this an if

    # NOTE: Can I force the key server to change the active PSK? Probably not

    gnmi_path = "/configure/macsec/connectivity-association[ca-name=" + ca_name + "]/static-cak"

    for host, config in keyConfigs:
      activePSK = {"active-psk": config['psk-id']}
      jsonify(set_gnmi_req([(gnmi_path, activePSK)], host.addr, host.sni, host.port, host.username, host.password))
    
    # WARN: check for lost packets
    for host in hostlist:
      host.enforce256CS(ca_name)
    
    return jsonify({"status": "success"}, 200) # TODO: What to put here

    # TODO: verifications after the request here

# Anysec Tunnel and Service Encryption
@app.route('/api/anysec', methods=['GET'])
def host_anysec_handling():

  # TODO: this should be a dict in the JSON
  hostlist = get_datafrom_req(request)

  responses = {}
  gnmi_path = "/configure/anysec"
  for host in hostlist:
    val, result = get_gnmi_req([gnmi_path], host.addr, host.sni, host.port, host.username, host.password)

    if result == 200:
      # WARN: Might need to recheck this with the final example
      if isinstance(val[0][1], list):
        val = val[0][1][0]
      else:
        val = val[0][1]
      responses[host.hostname] = val
    else:
      return jsonify(val, result)

  return responses

@app.route('/api/anysec/<group>/oper-state', methods=['GET'])
def anysec_group_admin_state(group):

  hostlist = get_datafrom_req(request)
  # TODO: logic for encryption types (tunnel and service). Create functions on host object
  # WARN: Quickfix

  tunnel_path = "/configure/anysec/tunnel-encryption/encryption-group[group-name=" + group + "]"
  service_path = "/configure/anysec/service-encryption/encryption-group[group-name=" + group + "]"

  responses = {}
  for host in hostlist:
    val, result = get_gnmi_req([tunnel_path, service_path], host.addr, host.sni, host.port, host.username, host.password)

    if result == 200:
      if val[0][0].__contains__("service"):
        host.getEncServicesByGroup(group)
        if host.encServicePath != None:
          val = "Up"
        else:
          val = "Down"
      elif val[0][0].__contains__("tunnel"):
        # TODO: Test this stuff tunnel stuff
        val = val[0][1].get("admin-state")
        if val == "enable":
          val = "Up"
        else:
          val = "Down"
      else:
        return jsonify(val, result)
      # WARN: Might need to recheck this with the final example
      # if isinstance(val[0][1], list):
      #   val = val[0][1][0]
      # else:
      #   val = val[0][1]
      responses[host.hostname] = val
    else:
      return jsonify(val, result)

  # print(responses, flush=True)
  return responses

@app.route('/api/anysec/<group>', methods=['GET'])
def host_anysec_instance_handling(group):

    hostlist = get_datafrom_req(request)
    # TODO: logic for encryption types (tunnel and service). Create functions on host object
    # WARN: Quickfix
    hostlist = hostlist[0]
    
    tunnel_path = "/configure/anysec/tunnel-encryption/encryption-group[group-name=" + group + "]"

    service_path = "/configure/anysec/service-encryption/encryption-group[group-name=" + group + "]"

    return jsonify(get_gnmi_req([tunnel_path, service_path], hostlist.addr, hostlist.sni, hostlist.port, hostlist.username, hostlist.password) )

# TODO: Enable/Disable tunnel and service encryption per anysec instance
# TODO: Endpoints for stats for the Landing Page

@app.route('/api/anysec/<group>/disable', methods=['POST'])
def host_anysec_instance_disabling(group):

    hostlist = get_datafrom_req(request)

    # TODO: logic for encryption types (tunnel and service). Create functions on host object
    # NOTE: This app kinda assumes all the hosts use the same encryption group name

    for host in hostlist:
      # TODO: host to hostlist
      host.importANYsecConfig(group)
      # TODO: if service encryption
      # TODO: Case where mixed tunnel encryption for one and service for another host
      host.getEncServicesByGroup(group)
      if host.getEncServPath == None and host.anysecType == "t": # TODO: check by ANYsec type attribute
        return jsonify({"status": "error",
                       "message": "At least one of the hosts doesn't have the encryption group",
                       }, 500)

    # Check if all the requested hosts have the encryption group
    for host in hostlist:
      values, result = host.leaveEncGroup()
      if result == 500:
        return jsonify(values)
    return jsonify({"status": "success"})

@app.route('/api/anysec/<group>/enable', methods=['POST'])
def host_anysec_instance_enabling(group):

    # TODO: Fix this endpoint
    hostlist = get_datafrom_req(request)

    # TODO: how to for tunnel encryption
    data = request.json # This data is only needed for creating a service encryption anysec instance
    service = data.get("service-name")
    cPlane = data.get("cPlane")
    instance = data.get("bgp-instance")

    # TODO: logic for encryption types (tunnel and service). Create functions on host object

    for host in hostlist:
      host.importANYsecConfig(group)
      host.createEncPath(group, service, cPlane, instance)

    # TODO: Check if response is 200
    # TODO: Make an iterator of this list
    # possibleServices = ["sdp", "ies", "epipe", "cpipe", "vpls", "vprn"]
    
    for host in hostlist:
      host.createEncPath(group, service, cPlane, instance)
    
    for host in hostlist:
      # WARN: Assert What if no path is given
      host.enableAnysecEnc()
    
    return jsonify({"status": "success"})

@app.route('/api/service', methods=['GET'])
def host_service_enum():

    hostlist = get_datafrom_req(request)

    gnmi_path = "/configure/service"

    return jsonify(get_gnmi_req([gnmi_path], hostlist, hostlist.sni, port, username, password))

@app.route('/api/service/<service>', methods=['GET'])
def host_service_handling(service):

    hostlist = get_datafrom_req(request)

    ies_path = "/configure/service/ies[service-name=" + service + "]"
    epipe_path = "/configure/service/epipe[service-name=" + service + "]"
    vpls_path = "/configure/service/vpls[service-name=" + service + "]"
    vprn_path = "/configure/service/vprn[service-name=" + service + "]"
    # TODO: distinguish between different types of services
    # Then service encryption only supports 2 types of vpn services
    # possibilities [epipe, vll, vprn, ies] what about ipipe and cpipe

    return jsonify(get_gnmi_req([ies_path, epipe_path, vpls_path, vprn_path], hostlist, hostlist.sni, port, username, password) )


# States and Statistics endpoints
@app.route('/api/state/anysec', methods=['GET'])
def host_anysec_state():

    # TODO: this should be a dict in the JSON
    hostlist = get_datafrom_req(request)
    # WARN: Quickfix
    # hostlist = hostlist[0]

    gnmi_path = "/state/anysec"
 
    responses = {}
    for host in hostlist:
      val, result = get_gnmi_req([gnmi_path], host.addr, host.sni, host.port, host.username, host.password)

      if result == 200:
        # WARN: Might need to recheck this with the final example
        if isinstance(val[0][1], list):
          val = val[0][1][0]
        else:
          val = val[0][1]
        responses[host.hostname] = val
      else:
        return jsonify(val, result)

    return responses

# WARN: Assumes tunnel encryption. Fix Later
@app.route('/api/state/anysec/<group>', methods=['GET'])
def host_anysec_instance_state(group):

    hostlist = get_datafrom_req(request)
    # WARN: Quickfix

    # TODO: logic for encryption types (tunnel and service). Create functions on host object

    tunnel_path = "/state/anysec/tunnel-encryption/encryption-group[group-name=" + group + "]"

    service_path = "/state/anysec/service-encryption/encryption-group[group-name=" + group + "]"

    responses = {}
    for host in hostlist:
      val, result = get_gnmi_req([tunnel_path, service_path], host.addr, host.sni, host.port, host.username, host.password)

      if result == 200:
        # WARN: Might need to recheck this with the final example
        if isinstance(val[0][1], list):
          val = val[0][1][0]
        else:
          val = val[0][1]
        responses[host.hostname] = val
      else:
        return jsonify(val, result)

    # print(responses, flush=True)
    return responses

if __name__ == '__main__':
    # Run the Flask app
    app.run(debug=True, port=5000)

