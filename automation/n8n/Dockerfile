FROM docker.n8n.io/n8nio/n8n:latest

USER root
COPY automation/n8n/render-start.sh /opt/n8n/render-start.sh
RUN chmod 755 /opt/n8n/render-start.sh
USER node

ENTRYPOINT ["/opt/n8n/render-start.sh"]
